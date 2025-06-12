/**
 * AISecurityMiddleware
 * Middleware de segurança para API de IA
 * Implementa autenticação, autorização, rate limiting e validação de entrada para API de IA
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const config = require('../config/securityConfig');
const logger = require('../utils/logger');
const secureMongoClient = require('../lib/mongodb/secureClient');

/**
 * Middleware de segurança para API de IA
 */
class AISecurityMiddleware {
  constructor() {
    this._initializeConfig();
  }

  /**
   * Inicializa configurações
   * @private
   */
  _initializeConfig() {
    this.JWT_SECRET = process.env.AI_API_JWT_SECRET || config.SECURITY.API.JWT_SECRET;
    this.TOKEN_EXPIRY = config.SECURITY.AI_API.TOKEN_EXPIRY || '1h';
    this.API_KEY_PREFIX = 'ak-';
    this.DEFAULT_RATE_LIMIT = config.SECURITY.RATE_LIMIT.AI_API || {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // limite por IP
    };
    
    logger.info('Middleware de segurança para API de IA inicializado');
  }
  
  /**
   * Limita requisições por IP
   * @param {Object} options - Opções para o rate limiter
   * @returns {Function} Middleware de rate limiting
   */
  rateLimit(options = {}) {
    const limitOptions = {
      windowMs: options.windowMs || this.DEFAULT_RATE_LIMIT.windowMs,
      max: options.max || this.DEFAULT_RATE_LIMIT.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 'error',
        codigo: 'LIMITE_EXCEDIDO',
        mensagem: 'Você excedeu o limite de requisições. Tente novamente mais tarde.'
      },
      skip: (req) => {
        // Skip para usuários autenticados com API key premium
        if (req.apiKey && req.apiKey.plan === 'premium') {
          return true;
        }
        return false;
      }
    };
    
    return rateLimit(limitOptions);
  }
  
  /**
   * Middleware para validar API keys
   * @param {string[]} requiredScope - Escopo necessário para acessar o recurso
   * @returns {Function} Middleware de validação de API key
   */
  validateApiKey(requiredScopes = []) {
    return async (req, res, next) => {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({
          status: 'error',
          codigo: 'API_KEY_NAO_FORNECIDA',
          mensagem: 'API key não fornecida'
        });
      }
      
      if (!apiKey.startsWith(this.API_KEY_PREFIX)) {
        return res.status(401).json({
          status: 'error',
          codigo: 'FORMATO_API_KEY_INVALIDO',
          mensagem: 'Formato de API key inválido'
        });
      }
      
      try {
        // Buscar API key no banco
        const apiKeyData = await secureMongoClient.findOne('apiKeys', { key: apiKey });
        
        if (!apiKeyData) {
          logger.warn('Tentativa de acesso com API key inválida', {
            apiKey: this._maskSensitiveData(apiKey),
            ip: req.ip
          });
          
          return res.status(401).json({
            status: 'error',
            codigo: 'API_KEY_INVALIDA',
            mensagem: 'API key inválida'
          });
        }
        
        // Verificar se a chave está ativa
        if (!apiKeyData.active) {
          logger.warn('Tentativa de acesso com API key inativa', {
            apiKeyId: apiKeyData._id,
            ip: req.ip
          });
          
          return res.status(401).json({
            status: 'error',
            codigo: 'API_KEY_INATIVA',
            mensagem: 'API key revogada ou inativa'
          });
        }
        
        // Verificar data de expiração
        if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
          logger.warn('Tentativa de acesso com API key expirada', {
            apiKeyId: apiKeyData._id,
            ip: req.ip
          });
          
          return res.status(401).json({
            status: 'error',
            codigo: 'API_KEY_EXPIRADA',
            mensagem: 'API key expirada'
          });
        }
        
        // Verificar domínios permitidos (origin)
        if (apiKeyData.allowedOrigins && apiKeyData.allowedOrigins.length > 0) {
          const origin = req.headers.origin || req.headers.referer;
          
          if (origin) {
            const originUrl = new URL(origin);
            const hostname = originUrl.hostname;
            
            if (!apiKeyData.allowedOrigins.some(domain => 
              hostname === domain || 
              (domain.startsWith('*.') && hostname.endsWith(domain.substring(1)))
            )) {
              logger.warn('Tentativa de acesso com API key de domínio não autorizado', {
                apiKeyId: apiKeyData._id,
                origin,
                ip: req.ip
              });
              
              return res.status(403).json({
                status: 'error',
                codigo: 'DOMINIO_NAO_AUTORIZADO',
                mensagem: 'Esta API key não pode ser usada a partir deste domínio'
              });
            }
          }
        }
        
        // Verificar escopo da API key
        if (requiredScopes.length > 0) {
          const hasRequiredScope = requiredScopes.some(scope => 
            apiKeyData.scopes.includes(scope) || apiKeyData.scopes.includes('*')
          );
          
          if (!hasRequiredScope) {
            logger.warn('Tentativa de acesso com API key sem escopo necessário', {
              apiKeyId: apiKeyData._id,
              requiredScopes,
              providedScopes: apiKeyData.scopes,
              ip: req.ip
            });
            
            return res.status(403).json({
              status: 'error',
              codigo: 'ESCOPO_INSUFICIENTE',
              mensagem: 'API key não possui permissão para este recurso'
            });
          }
        }
        
        // Registrar uso da API key
        this._logApiKeyUsage(apiKeyData._id, req).catch(err => {
          logger.error('Erro ao registrar uso de API key', err);
        });
        
        // Guardar dados da API key no objeto da requisição
        req.apiKey = {
          id: apiKeyData._id,
          owner: apiKeyData.userId,
          name: apiKeyData.name,
          scopes: apiKeyData.scopes,
          plan: apiKeyData.plan || 'standard',
          allowedActions: apiKeyData.allowedActions || ['text', 'embeddings']
        };
        
        next();
      } catch (error) {
        logger.error('Erro ao validar API key', error);
        
        res.status(500).json({
          status: 'error',
          codigo: 'ERRO_AUTENTICACAO',
          mensagem: 'Erro interno ao validar autenticação'
        });
      }
    };
  }
  
  /**
   * Middleware para validar token temporário
   * @returns {Function} Middleware de validação de token
   */
  validateToken() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          status: 'error',
          codigo: 'TOKEN_NAO_FORNECIDO',
          mensagem: 'Token não fornecido'
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, this.JWT_SECRET);
        
        // Verificar tipo de token
        if (decoded.type !== 'ai-api-token') {
          return res.status(401).json({
            status: 'error',
            codigo: 'TIPO_TOKEN_INVALIDO',
            mensagem: 'Tipo de token inválido'
          });
        }
        
        // Guardar dados do token no objeto da requisição
        req.token = decoded;
        
        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            status: 'error',
            codigo: 'TOKEN_EXPIRADO',
            mensagem: 'Token expirado'
          });
        }
        
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            status: 'error',
            codigo: 'TOKEN_INVALIDO',
            mensagem: 'Token inválido'
          });
        }
        
        logger.error('Erro ao validar token', error);
        
        res.status(500).json({
          status: 'error',
          codigo: 'ERRO_AUTENTICACAO',
          mensagem: 'Erro interno ao validar autenticação'
        });
      }
    };
  }
  
  /**
   * Middleware para autorizar escopo de acesso
   * @param {string[]} requiredScopes - Escopos necessários para acessar o recurso
   * @returns {Function} Middleware de autorização
   */
  authorizeScope(requiredScopes = []) {
    return (req, res, next) => {
      // Verificar se é token ou API key
      const scopes = req.token?.scopes || req.apiKey?.scopes || [];
      
      if (requiredScopes.length === 0 || scopes.includes('*')) {
        return next();
      }
      
      const hasRequiredScope = requiredScopes.some(scope => scopes.includes(scope));
      
      if (!hasRequiredScope) {
        return res.status(403).json({
          status: 'error',
          codigo: 'ESCOPO_INSUFICIENTE',
          mensagem: 'Você não possui permissão para acessar este recurso'
        });
      }
      
      next();
    };
  }
  
  /**
   * Middleware para validar esquema de entrada
   * @param {Object} schema - Esquema Zod para validação
   * @param {string} source - Fonte dos dados ('body', 'query', 'params')
   * @returns {Function} Middleware de validação
   */
  validateInput(schema, source = 'body') {
    return (req, res, next) => {
      try {
        const data = source === 'body' ? req.body : 
                     source === 'query' ? req.query : 
                     source === 'params' ? req.params : req.body;
        
        const validatedData = schema.parse(data);
        
        // Armazenar dados validados
        switch (source) {
          case 'body':
            req.validatedBody = validatedData;
            break;
          case 'query':
            req.validatedQuery = validatedData;
            break;
          case 'params':
            req.validatedParams = validatedData;
            break;
          default:
            req.validatedBody = validatedData;
        }
        
        next();
      } catch (error) {
        if (error.errors) {
          return res.status(400).json({
            status: 'error',
            codigo: 'ENTRADA_INVALIDA',
            mensagem: 'Dados de entrada inválidos',
            detalhes: error.errors.map(err => ({
              campo: err.path.join('.'),
              mensagem: err.message
            }))
          });
        }
        
        res.status(400).json({
          status: 'error',
          codigo: 'ENTRADA_INVALIDA',
          mensagem: 'Dados de entrada inválidos'
        });
      }
    };
  }
  
  /**
   * Gera um token temporário para API de IA
   * @param {string} userId - ID do usuário
   * @param {string[]} scopes - Escopos permitidos
   * @param {string} expiry - Tempo de expiração
   * @returns {string} Token JWT
   */
  generateToken(userId, scopes = ['text'], expiry = null) {
    const tokenId = crypto.randomUUID();
    
    const payload = {
      jti: tokenId,
      userId,
      type: 'ai-api-token',
      scopes,
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: expiry || this.TOKEN_EXPIRY
    });
  }
  
  /**
   * Gera uma nova API key
   * @param {Object} options - Opções da API key
   * @returns {Object} Objeto com a API key
   */
  generateApiKey(options) {
    const keyValue = this.API_KEY_PREFIX + this._generateRandomKey();
    
    return {
      key: keyValue,
      userId: options.userId,
      name: options.name || 'API Key',
      scopes: options.scopes || ['text'],
      allowedOrigins: options.allowedOrigins || [],
      expiresAt: options.expiresAt || null,
      active: true,
      plan: options.plan || 'standard',
      createdAt: new Date(),
      lastUsed: null
    };
  }
  
  /**
   * Middleware para registrar uso da API
   * @returns {Function} Middleware de log
   */
  logUsage() {
    return (req, res, next) => {
      // Configurar tempo de início
      req.aiApiRequestStart = Date.now();
      
      // Capturar o corpo da resposta
      const originalSend = res.send;
      
      res.send = function(body) {
        res.body = body;
        originalSend.call(this, body);
      };
      
      // Executar ao finalizar a requisição
      res.on('finish', () => {
        const requestTime = Date.now() - req.aiApiRequestStart;
        const route = req.route?.path || req.path;
        const method = req.method;
        const statusCode = res.statusCode;
        const userId = req.user?.id || req.token?.userId || req.apiKey?.owner || 'anonymous';
        
        // Registrar uso
        secureMongoClient.insert('aiApiLogs', {
          userId,
          authenticationType: req.user ? 'session' : (req.token ? 'token' : (req.apiKey ? 'apiKey' : 'none')),
          apiKeyId: req.apiKey?.id,
          tokenId: req.token?.jti,
          route,
          method,
          statusCode,
          requestTime,
          timestamp: new Date(),
          ip: this._maskIP(req.ip),
          userAgent: req.headers['user-agent'],
          success: statusCode < 400
        }).catch(error => {
          logger.error('Erro ao registrar uso da API de IA', error);
        });
      });
      
      next();
    };
  }
  
  /**
   * Revoga um token JWT
   * @param {string} tokenId - ID do token (jti)
   * @returns {Promise<boolean>} - Indica se o token foi revogado com sucesso
   */
  async revokeToken(tokenId) {
    try {
      await secureMongoClient.insert('revokedTokens', {
        tokenId,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      });
      
      return true;
    } catch (error) {
      logger.error('Erro ao revogar token', error);
      return false;
    }
  }
  
  /**
   * Verifica se um token está revogado
   * @param {string} tokenId - ID do token (jti)
   * @returns {Promise<boolean>} - Indica se o token está revogado
   */
  async isTokenRevoked(tokenId) {
    try {
      const revoked = await secureMongoClient.findOne('revokedTokens', { tokenId });
      return !!revoked;
    } catch (error) {
      logger.error('Erro ao verificar token revogado', error);
      return false;
    }
  }
  
  /**
   * Gera uma chave aleatória para API key
   * @returns {string} Chave aleatória
   * @private
   */
  _generateRandomKey() {
    const keyBuffer = crypto.randomBytes(24);
    return keyBuffer.toString('base64url');
  }
  
  /**
   * Registra uso de API key
   * @param {string} apiKeyId - ID da API key
   * @param {object} req - Requisição Express
   * @returns {Promise<void>}
   * @private
   */
  async _logApiKeyUsage(apiKeyId, req) {
    try {
      // Atualizar último uso da API key
      await secureMongoClient.updateOne('apiKeys', 
        { _id: apiKeyId },
        { $set: { lastUsed: new Date() } }
      );
      
      // Registrar uso detalhado
      await secureMongoClient.insert('apiKeyUsage', {
        apiKeyId,
        route: req.route?.path || req.path,
        method: req.method,
        timestamp: new Date(),
        ip: this._maskIP(req.ip),
        userAgent: req.headers['user-agent']
      });
    } catch (error) {
      logger.error('Erro ao registrar uso de API key', error);
    }
  }
  
  /**
   * Mascara dados sensíveis para logs
   * @param {string} data - Dados a mascarar
   * @returns {string} Dados mascarados
   * @private
   */
  _maskSensitiveData(data) {
    if (!data || typeof data !== 'string') {
      return '';
    }
    
    if (data.length <= 8) {
      return '***';
    }
    
    return data.substring(0, 4) + '***' + data.substring(data.length - 4);
  }
  
  /**
   * Mascara IP para logs
   * @param {string} ip - Endereço IP
   * @returns {string} IP mascarado
   * @private
   */
  _maskIP(ip) {
    if (!ip) return '';
    
    // IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    
    // IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return `${parts[0]}:${parts[1]}:***:***`;
    }
    
    return ip;
  }
  
  /**
   * Esquemas de validação para endpoints comuns
   */
  schemas = {
    /**
     * Esquema para geração de texto
     */
    textGeneration: z.object({
      prompt: z.string().min(1).max(4000),
      maxTokens: z.number().int().positive().optional(),
      temperature: z.number().min(0).max(1).optional(),
      options: z.object({
        model: z.string().optional(),
        stream: z.boolean().optional(),
        stopSequences: z.array(z.string()).optional()
      }).optional()
    }),
    
    /**
     * Esquema para geração de imagem
     */
    imageGeneration: z.object({
      prompt: z.string().min(1).max(1000),
      negativePrompt: z.string().max(1000).optional(),
      width: z.number().int().min(64).max(1024).optional(),
      height: z.number().int().min(64).max(1024).optional(),
      numberOfImages: z.number().int().min(1).max(4).optional(),
      options: z.object({
        model: z.string().optional(),
        format: z.enum(['jpeg', 'png', 'webp']).optional()
      }).optional()
    }),
    
    /**
     * Esquema para geração de embeddings
     */
    embedding: z.object({
      text: z.string().min(1).max(8000),
      model: z.string().optional()
    }),
    
    /**
     * Esquema para criação de API key
     */
    createApiKey: z.object({
      name: z.string().min(1).max(100),
      scopes: z.array(z.string()).optional(),
      allowedOrigins: z.array(z.string()).optional(),
      expiresAt: z.string().datetime().optional(),
      plan: z.enum(['standard', 'premium']).optional()
    })
  };
}

// Criar instância única do middleware
const aiSecurityMiddleware = new AISecurityMiddleware();

module.exports = aiSecurityMiddleware; 