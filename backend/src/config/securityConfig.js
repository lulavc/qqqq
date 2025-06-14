/**
 * Security configurations for the system
 * Centralizes all security-related settings for the application
 */
require('dotenv').config();

const securityConfig = {
  // General API security settings
  SECURITY: {
    // API protection settings
    API: {
      JWT_SECRET: process.env.JWT_SECRET || 'your-default-secret-key-replace-in-production',
      TOKEN_EXPIRY: '24h',
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000'],
      CORS_OPTIONS: {
        credentials: true,
        exposedHeaders: ['Content-Disposition']
      }
    },

    // Specific settings for AI API
    AI_API: {
      TOKEN_EXPIRY: '1h',
      CONTENT_FILTERING: {
        ENABLED: true,
        // List of terms that should not be allowed in requests to the AI API
        RESTRICTED_TERMS: [
          'password',        // 'senha' translated
          'credit card',     // 'cartão de crédito' translated
          'cpf',             // Maintained as is, specific Brazilian document
          'cnpj',            // Maintained as is, specific Brazilian document
          'rg'               // Maintained as is, specific Brazilian document
        ]
      }
    },

    // Rate limiting settings
    RATE_LIMIT: {
      STANDARD: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // Standard limit per IP
      },
      AUTH: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20 // Limit for authentication routes
      },
      AI_API: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50 // Limit for AI API (per IP)
      },
      SPECIFIC_LIMITS: {
        '/api/ai/image/generate': {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 10 // More restrictive limit for image generation
        },
        '/api/auth/login': {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 15 // Limit for login attempts
        }
      }
    },

    // Content-Security-Policy settings
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

  // Settings for MongoDB
  MONGODB: {
    // Connection options
    CONNECTION_OPTIONS: {
      // Security settings for MongoDB connection
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      ssl: process.env.NODE_ENV === 'production', // Enable SSL in production
      sslValidate: process.env.NODE_ENV === 'production',
      // Options for connection retry
      retryWrites: true,
      retryReads: true,
      // Cache for known servers
      maxPoolSize: 10, // Connection pool limit
      minPoolSize: 2 // Keep at least two active connections
    }
  },

  // Settings for encryption and hashing
  CRYPTO: {
    // Settings for password hashing
    PASSWORD_HASH: {
      SALT_ROUNDS: 12, // Number of rounds for bcrypt
      PEPPER: process.env.PASSWORD_PEPPER || 'secret-pepper-replace-in-production'
    },

    // Settings for tokens
    TOKENS: {
      REFRESH_TOKEN_EXPIRY: '7d',
      RESET_PASSWORD_EXPIRY: '1h',
      EMAIL_VERIFICATION_EXPIRY: '24h'
    }
  },

  // Settings for AI models
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

  // Plans and limits for AI API
  AI_PLANS: {
    standard: {
      'text-generation': {
        limit: 100000, // tokens per month
        rateLimit: 50 // requests per hour
      },
      'image-generation': {
        limit: 50, // images per month
        rateLimit: 10 // requests per hour
      },
      'embedding': {
        limit: 50000, // tokens per month
        rateLimit: 100 // requests per hour
      }
    },
    premium: {
      'text-generation': {
        limit: 1000000, // tokens per month
        rateLimit: 100 // requests per hour
      },
      'image-generation': {
        limit: 200, // images per month
        rateLimit: 30 // requests per hour
      },
      'embedding': {
        limit: 500000, // tokens per month
        rateLimit: 300 // requests per hour
      }
    },
    enterprise: {
      'text-generation': {
        limit: -1, // unlimited
        rateLimit: 300 // requests per hour
      },
      'image-generation': {
        limit: -1, // unlimited
        rateLimit: 100 // requests per hour
      },
      'embedding': {
        limit: -1, // unlimited
        rateLimit: 1000 // requests per hour
      }
    }
  }
};

module.exports = securityConfig;
