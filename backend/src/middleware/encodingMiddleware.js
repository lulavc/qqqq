/**
 * Middleware para garantir codificação UTF-8 adequada em toda a aplicação
 * Previne problemas de encoding com caracteres portugueses
 */

const utf8 = require('utf8');

/**
 * Middleware para validar e corrigir encoding UTF-8
 */
const ensureUTF8Encoding = (req, res, next) => {
  try {
    // Configurar headers de resposta para UTF-8
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Accept-Charset', 'utf-8');
    
    // Validar e corrigir encoding do body da requisição
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObjectEncoding(req.body);
    }
    
    // Validar query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObjectEncoding(req.query);
    }
    
    // Validar parâmetros da URL
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObjectEncoding(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware de encoding:', error);
    res.status(400).json({
      success: false,
      message: 'Erro de codificação de caracteres. Verifique se está usando UTF-8.',
      error: 'ENCODING_ERROR'
    });
  }
};

/**
 * Sanitiza recursivamente um objeto para garantir encoding UTF-8 correto
 */
function sanitizeObjectEncoding(obj) {
  if (typeof obj === 'string') {
    return sanitizeStringEncoding(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectEncoding(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeStringEncoding(key);
      sanitized[sanitizedKey] = sanitizeObjectEncoding(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Sanitiza uma string para garantir encoding UTF-8 correto
 */
function sanitizeStringEncoding(str) {
  if (typeof str !== 'string') return str;
  
  try {
    // Remove caracteres de controle inválidos
    let cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Verifica se já está em UTF-8 válido
    if (isValidUTF8(cleaned)) {
      return cleaned;
    }
    
    // Tenta decodificar como UTF-8
    try {
      cleaned = utf8.decode(cleaned);
    } catch (e) {
      // Se falhar, tenta outras estratégias
      cleaned = Buffer.from(cleaned, 'binary').toString('utf8');
    }
    
    return cleaned;
  } catch (error) {
    console.warn('Erro ao sanitizar string:', error);
    return str;
  }
}

/**
 * Verifica se uma string é UTF-8 válida
 */
function isValidUTF8(str) {
  try {
    return str === Buffer.from(str, 'utf8').toString('utf8');
  } catch (e) {
    return false;
  }
}

/**
 * Middleware para interceptar respostas e garantir encoding correto
 */
const ensureUTF8Response = (req, res, next) => {
  // Interceptar o método json
  const originalJson = res.json;
  
  res.json = function(data) {
    // Garantir que a resposta está em UTF-8
    if (data && typeof data === 'object') {
      data = sanitizeObjectEncoding(data);
    }
    
    // Configurar headers corretos
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    return originalJson.call(this, data);
  };
  
  // Interceptar o método send
  const originalSend = res.send;
  
  res.send = function(data) {
    if (typeof data === 'string') {
      data = sanitizeStringEncoding(data);
      this.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Utilitário para validar texto português
 */
const validatePortugueseText = (text) => {
  if (typeof text !== 'string') return true;
  
  // Caracteres especiais do português brasileiro
  const portugueseChars = /[àáâãäéêëíîïóôõöúûüç]/i;
  const hasPortuguese = portugueseChars.test(text);
  
  if (hasPortuguese) {
    // Verifica se os caracteres estão sendo exibidos corretamente
    const problematicPattern = /[��]/g;
    if (problematicPattern.test(text)) {
      return false;
    }
  }
  
  return true;
};

module.exports = {
  ensureUTF8Encoding,
  ensureUTF8Response,
  sanitizeObjectEncoding,
  sanitizeStringEncoding,
  validatePortugueseText,
  isValidUTF8
};