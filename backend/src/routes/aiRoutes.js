const express = require('express');
const router = express.Router();
const { AISecurityMiddleware, aiSchemas } = require('../middleware/aiSecurityMiddleware');
const logger = require('../utils/logger');
const SecurityOverview = require('../middleware/securityOverview');
const aiController = require('../controllers/aiController');
const aiSecurityMiddleware = require('../middleware/aiSecurityMiddleware');
const securityMiddleware = require('../middleware/securityMiddleware');
const secureMongoClient = require('../lib/mongodb/secureClient');

/**
 * Rotas para API de IA com medidas de segurança implementadas
 * Implementa proteção contra uso irregular por usuários não autorizados
 */

// Middleware de segurança para todas as rotas de IA
router.use(AISecurityMiddleware.aiRateLimiter());
router.use(AISecurityMiddleware.logAIUsage());

// Middleware para todas as rotas de IA: rate limit e log
router.use(aiSecurityMiddleware.rateLimit(), aiSecurityMiddleware.logUsage());

// Rota para gerar um token temporário para API de IA (requer usuário autenticado)
router.post('/token/generate', securityMiddleware.requireAuth(), async (req, res) => {
  try {
    const token = aiSecurityMiddleware.generateToken(req.user.id, ['text', 'embedding'], '2h');
    res.status(200).json({ status: 'success', token, expiresIn: '2h' });
  } catch (error) {
    logger.error('Erro ao gerar token para API', error);
    res.status(500).json({ status: 'error', codigo: 'ERRO_GERACAO_TOKEN', mensagem: 'Falha ao gerar token' });
  }
});

// Rotas para gerenciar chaves de API
router.route('/keys')
  // Listar chaves de API (requer autenticação)
  .get(securityMiddleware.requireAuth(), async (req, res) => {
    try {
      const apiKeys = await secureMongoClient.find('apiKeys', { 
        userId: req.user.id,
        active: true
      }, { 
        projection: { key: 0 } // Não retornar a chave completa 
      });
      
      res.status(200).json({ 
        status: 'success', 
        data: apiKeys.map(key => ({
          id: key._id,
          name: key.name,
          scopes: key.scopes,
          plan: key.plan,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed,
          expiresAt: key.expiresAt,
          // Mostrar apenas os primeiros caracteres da chave
          keyPreview: key.key ? `${key.key.substring(0, 8)}...` : null
        }))
      });
    } catch (error) {
      logger.error('Erro ao listar chaves de API', error);
      res.status(500).json({ status: 'error', codigo: 'ERRO_LISTAGEM', mensagem: 'Falha ao listar chaves' });
    }
  })
  // Criar nova chave de API (requer autenticação)
  .post(
    securityMiddleware.requireAuth(),
    aiSecurityMiddleware.validateInput(aiSecurityMiddleware.schemas.createApiKey),
    async (req, res) => {
      try {
        const { name, scopes, allowedOrigins, expiresAt, plan } = req.validatedBody;
        
        // Verificar se o usuário tem permissão para o plano solicitado
        if (plan === 'premium' && req.user.role !== 'admin') {
          return res.status(403).json({
            status: 'error',
            codigo: 'PLANO_NAO_AUTORIZADO',
            mensagem: 'Você não tem permissão para criar chaves com este plano'
          });
        }
        
        // Gerar nova chave
        const apiKeyData = aiSecurityMiddleware.generateApiKey({
          userId: req.user.id,
          name,
          scopes: scopes || ['text'],
          allowedOrigins,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          plan: plan || 'standard'
        });
        
        // Salvar no banco de dados
        const result = await secureMongoClient.insert('apiKeys', apiKeyData);
        
        logger.info('Nova chave de API criada', { 
          userId: req.user.id,
          keyId: result.insertedId,
          scopes: apiKeyData.scopes
        });
        
        res.status(201).json({
          status: 'success',
          mensagem: 'Chave de API criada com sucesso',
          data: {
            key: apiKeyData.key, // Retornar a chave completa apenas na criação
            id: result.insertedId,
            name: apiKeyData.name,
            scopes: apiKeyData.scopes,
            plan: apiKeyData.plan,
            expiresAt: apiKeyData.expiresAt
          }
        });
      } catch (error) {
        logger.error('Erro ao criar chave de API', error);
        res.status(500).json({ status: 'error', codigo: 'ERRO_CRIACAO', mensagem: 'Falha ao criar chave' });
      }
    }
  );

// Revogar uma chave de API
router.delete('/keys/:keyId', securityMiddleware.requireAuth(), async (req, res) => {
  try {
    const { keyId } = req.params;
    
    // Verificar se a chave pertence ao usuário
    const apiKey = await secureMongoClient.findOne('apiKeys', { 
      _id: keyId,
      userId: req.user.id
    });
    
    if (!apiKey) {
      return res.status(404).json({
        status: 'error',
        codigo: 'CHAVE_NAO_ENCONTRADA',
        mensagem: 'Chave de API não encontrada ou não pertence a este usuário'
      });
    }
    
    // Revogar a chave (desativar)
    await secureMongoClient.updateOne('apiKeys', 
      { _id: keyId },
      { $set: { active: false, revokedAt: new Date() } }
    );
    
    logger.info('Chave de API revogada', { keyId, userId: req.user.id });
    
    res.status(200).json({
      status: 'success',
      mensagem: 'Chave de API revogada com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao revogar chave de API', error);
    res.status(500).json({ status: 'error', codigo: 'ERRO_REVOGACAO', mensagem: 'Falha ao revogar chave' });
  }
});

// Rota para geração de texto (protegida por API key ou token)
router.post('/text/generate', 
  // Verificar API key OU token
  (req, res, next) => {
    // Se tem header de API key, valida API key
    if (req.headers['x-api-key']) {
      return aiSecurityMiddleware.validateApiKey(['text'])(req, res, next);
    }
    // Se não, valida token JWT
    return aiSecurityMiddleware.validateToken()(req, res, next);
  },
  // Verificar escopo
  aiSecurityMiddleware.authorizeScope(['text']),
  // Validar entrada
  aiSecurityMiddleware.validateInput(aiSecurityMiddleware.schemas.textGeneration),
  // Controller
  aiController.generateText
);

// Rota para geração de imagem (protegida por API key ou token)
router.post('/image/generate', 
  // Verificar API key OU token
  (req, res, next) => {
    if (req.headers['x-api-key']) {
      return aiSecurityMiddleware.validateApiKey(['image'])(req, res, next);
    }
    return aiSecurityMiddleware.validateToken()(req, res, next);
  },
  // Verificar escopo
  aiSecurityMiddleware.authorizeScope(['image']),
  // Validar entrada
  aiSecurityMiddleware.validateInput(aiSecurityMiddleware.schemas.imageGeneration),
  // Controller
  aiController.generateImage
);

// Rota para geração de embeddings (protegida por API key ou token)
router.post('/embeddings', 
  // Verificar API key OU token
  (req, res, next) => {
    if (req.headers['x-api-key']) {
      return aiSecurityMiddleware.validateApiKey(['embedding'])(req, res, next);
    }
    return aiSecurityMiddleware.validateToken()(req, res, next);
  },
  // Verificar escopo
  aiSecurityMiddleware.authorizeScope(['embedding']),
  // Validar entrada
  aiSecurityMiddleware.validateInput(aiSecurityMiddleware.schemas.embedding),
  // Controller
  aiController.generateEmbedding
);

// Rota para verificar status da API
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'success',
    mensagem: 'API de IA operacional'
  });
});

// Rota para documentação pública da API
router.get('/docs', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      nome: 'AInovar Tech API',
      versao: '1.0.0',
      endpoints: [
        {
          path: '/api/ai/status',
          metodo: 'GET',
          descricao: 'Verifica status da API',
          autenticacao: 'Nenhuma'
        },
        {
          path: '/api/ai/token/generate',
          metodo: 'POST',
          descricao: 'Gera um token temporário para uso da API',
          autenticacao: 'Sessão de usuário'
        },
        {
          path: '/api/ai/text/generate',
          metodo: 'POST',
          descricao: 'Gera texto com base em um prompt',
          autenticacao: 'API key ou token',
          documentacao: 'Requer escopo "text"'
        },
        {
          path: '/api/ai/image/generate',
          metodo: 'POST',
          descricao: 'Gera imagem com base em um prompt',
          autenticacao: 'API key ou token',
          documentacao: 'Requer escopo "image"'
        },
        {
          path: '/api/ai/embeddings',
          metodo: 'POST',
          descricao: 'Gera embedding para texto',
          autenticacao: 'API key ou token',
          documentacao: 'Requer escopo "embedding"'
        }
      ]
    }
  });
});

module.exports = router; 