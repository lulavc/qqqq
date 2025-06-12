/**
 * Configurações de segurança para o sistema
 * Centraliza todas as configurações relacionadas à segurança da aplicação
 */
require('dotenv').config();

const securityConfig = {
  // Configurações gerais de segurança da API
  SECURITY: {
    // Configurações de proteção para API
    API: {
      JWT_SECRET: process.env.JWT_SECRET || 'sua-chave-secreta-padrao-substitua-em-producao',
      TOKEN_EXPIRY: '24h',
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : ['http://localhost:3000'],
      CORS_OPTIONS: {
        credentials: true,
        exposedHeaders: ['Content-Disposition']
      }
    },
    
    // Configurações específicas para API de IA
    AI_API: {
      TOKEN_EXPIRY: '1h',
      CONTENT_FILTERING: {
        ENABLED: true,
        // Lista de termos que não devem ser permitidos nas requisições à API de IA
        RESTRICTED_TERMS: [
          'senha', 'password', 'credit card', 'cartão de crédito', 'cpf', 'cnpj', 'rg'
        ]
      }
    },
    
    // Configurações de rate limiting
    RATE_LIMIT: {
      STANDARD: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100 // Limite padrão por IP
      },
      AUTH: {
        windowMs: 60 * 60 * 1000, // 1 hora
        max: 20 // Limite para rotas de autenticação
      },
      AI_API: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 50 // Limite para API de IA (por IP)
      },
      SPECIFIC_LIMITS: {
        '/api/ai/image/generate': {
          windowMs: 15 * 60 * 1000,
          max: 10 // Limite mais restritivo para geração de imagens
        },
        '/api/auth/login': {
          windowMs: 15 * 60 * 1000,
          max: 15 // Limite para tentativas de login
        }
      }
    },
    
    // Configurações de Content-Security-Policy
    CSP: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://api.cloudinary.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"]
      }
    }
  },
  
  // Configurações para MongoDB
  MONGODB: {
    // Opções de conexão
    CONNECTION_OPTIONS: {
      // Configurações de segurança para conexão MongoDB
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      ssl: process.env.NODE_ENV === 'production', // Ativar SSL em produção
      sslValidate: process.env.NODE_ENV === 'production',
      // Opções para retry na conexão
      retryWrites: true,
      retryReads: true,
      // Cache para servidores conhecidos
      maxPoolSize: 10, // Limite de conexões simultâneas
      minPoolSize: 2 // Manter pelo menos duas conexões ativas
    }
  },
  
  // Configurações para criptografia e hashing
  CRYPTO: {
    // Configurações para hashing de senha
    PASSWORD_HASH: {
      SALT_ROUNDS: 12, // Número de rounds para bcrypt
      PEPPER: process.env.PASSWORD_PEPPER || 'pepper-secreto-substitua-em-producao'
    },
    
    // Configurações para tokens
    TOKENS: {
      REFRESH_TOKEN_EXPIRY: '7d',
      RESET_PASSWORD_EXPIRY: '1h',
      EMAIL_VERIFICATION_EXPIRY: '24h'
    }
  },
  
  // Configurações para modelos de IA
  AI_MODELS: {
    TEXT: {
      DEFAULT: 'gpt-3.5-turbo',
      AVAILABLE_MODELS: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      DEFAULT_MAX_TOKENS: 500,
      DEFAULT_TEMPERATURE: 0.7
    },
    IMAGE: {
      DEFAULT: 'dall-e-3',
      AVAILABLE_MODELS: ['dall-e-2', 'dall-e-3', 'stable-diffusion-3'],
      DEFAULT_WIDTH: 512,
      DEFAULT_HEIGHT: 512
    },
    EMBEDDING: {
      DEFAULT: 'text-embedding-ada-002',
      AVAILABLE_MODELS: ['text-embedding-ada-002']
    }
  },
  
  // Planos e limites para API de IA
  AI_PLANS: {
    standard: {
      'text-generation': {
        limit: 100000, // tokens por mês
        rateLimit: 50 // requisições por hora
      },
      'image-generation': {
        limit: 50, // imagens por mês
        rateLimit: 10 // requisições por hora
      },
      'embedding': {
        limit: 50000, // tokens por mês
        rateLimit: 100 // requisições por hora
      }
    },
    premium: {
      'text-generation': {
        limit: 1000000, // tokens por mês
        rateLimit: 100 // requisições por hora
      },
      'image-generation': {
        limit: 200, // imagens por mês
        rateLimit: 30 // requisições por hora
      },
      'embedding': {
        limit: 500000, // tokens por mês
        rateLimit: 300 // requisições por hora
      }
    },
    enterprise: {
      'text-generation': {
        limit: -1, // ilimitado
        rateLimit: 300 // requisições por hora
      },
      'image-generation': {
        limit: -1, // ilimitado
        rateLimit: 100 // requisições por hora
      },
      'embedding': {
        limit: -1, // ilimitado
        rateLimit: 1000 // requisições por hora
      }
    }
  }
};

module.exports = securityConfig; 