/**
 * AISecurityMiddleware
 * Security middleware for AI API
 * Implements authentication, authorization, rate limiting, and input validation for AI API
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const config = require('../config/securityConfig');
const logger = require('../utils/logger');
const secureMongoClient = require('../lib/mongodb/secureClient');

/**
 * Security middleware for AI API
 */
class AISecurityMiddleware {
  constructor() {
    this._initializeConfig();
  }

  /**
   * Initializes configurations
   * @private
   */
  _initializeConfig() {
    this.JWT_SECRET = process.env.AI_API_JWT_SECRET || config.SECURITY.API.JWT_SECRET;
    this.TOKEN_EXPIRY = config.SECURITY.AI_API.TOKEN_EXPIRY || '1h';
    this.API_KEY_PREFIX = 'ak-';
    this.DEFAULT_RATE_LIMIT = config.SECURITY.RATE_LIMIT.AI_API || {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit per IP
    };

    logger.info('AI API security middleware initialized');
  }

  /**
   * Limits requests per IP
   * @param {Object} options - Options for the rate limiter
   * @returns {Function} Rate limiting middleware
   */
  rateLimit(options = {}) {
    const limitOptions = {
      windowMs: options.windowMs || this.DEFAULT_RATE_LIMIT.windowMs,
      max: options.max || this.DEFAULT_RATE_LIMIT.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'You have exceeded the request limit. Try again later.'
      },
      skip: (req) => {
        // Skip for authenticated users with a premium API key
        if (req.apiKey && req.apiKey.plan === 'premium') {
          return true;
        }
        return false;
      }
    };

    return rateLimit(limitOptions);
  }

  /**
   * Middleware to validate API keys
   * @param {string[]} requiredScopes - Scope required to access the resource
   * @returns {Function} API key validation middleware
   */
  validateApiKey(requiredScopes = []) {
    return async (req, res, next) => {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey) {
        return res.status(401).json({
          status: 'error',
          code: 'API_KEY_NOT_PROVIDED',
          message: 'API key not provided'
        });
      }

      if (!apiKey.startsWith(this.API_KEY_PREFIX)) {
        return res.status(401).json({
          status: 'error',
          code: 'INVALID_API_KEY_FORMAT',
          message: 'Invalid API key format'
        });
      }

      try {
        // Fetch API key from the database
        const apiKeyData = await secureMongoClient.findOne('apiKeys', { key: apiKey });

        if (!apiKeyData) {
          logger.warn('Access attempt with invalid API key', {
            apiKey: this._maskSensitiveData(apiKey),
            ip: req.ip
          });

          return res.status(401).json({
            status: 'error',
            code: 'INVALID_API_KEY',
            message: 'Invalid API key'
          });
        }

        // Check if the key is active
        if (!apiKeyData.active) {
          logger.warn('Access attempt with inactive API key', {
            apiKeyId: apiKeyData._id,
            ip: req.ip
          });

          return res.status(401).json({
            status: 'error',
            code: 'API_KEY_INACTIVE',
            message: 'API key revoked or inactive'
          });
        }

        // Check expiration date
        if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
          logger.warn('Access attempt with expired API key', {
            apiKeyId: apiKeyData._id,
            ip: req.ip
          });

          return res.status(401).json({
            status: 'error',
            code: 'API_KEY_EXPIRED',
            message: 'API key expired'
          });
        }

        // Check allowed domains (origin)
        if (apiKeyData.allowedOrigins && apiKeyData.allowedOrigins.length > 0) {
          const origin = req.headers.origin || req.headers.referer;

          if (origin) {
            const originUrl = new URL(origin);
            const hostname = originUrl.hostname;

            if (!apiKeyData.allowedOrigins.some(domain =>
              hostname === domain ||
              (domain.startsWith('*.') && hostname.endsWith(domain.substring(1)))
            )) {
              logger.warn('Access attempt with API key from unauthorized domain', {
                apiKeyId: apiKeyData._id,
                origin,
                ip: req.ip
              });

              return res.status(403).json({
                status: 'error',
                code: 'UNAUTHORIZED_DOMAIN',
                message: 'This API key cannot be used from this domain'
              });
            }
          }
        }

        // Check API key scope
        if (requiredScopes.length > 0) {
          const hasRequiredScope = requiredScopes.some(scope =>
            apiKeyData.scopes.includes(scope) || apiKeyData.scopes.includes('*')
          );

          if (!hasRequiredScope) {
            logger.warn('Access attempt with API key lacking required scope', {
              apiKeyId: apiKeyData._id,
              requiredScopes,
              providedScopes: apiKeyData.scopes,
              ip: req.ip
            });

            return res.status(403).json({
              status: 'error',
              code: 'INSUFFICIENT_SCOPE',
              message: 'API key does not have permission for this resource'
            });
          }
        }

        // Log API key usage
        this._logApiKeyUsage(apiKeyData._id, req).catch(err => {
          logger.error('Error logging API key usage', err);
        });

        // Store API key data in the request object
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
        logger.error('Error validating API key', error);

        res.status(500).json({
          status: 'error',
          code: 'AUTHENTICATION_ERROR',
          message: 'Internal error validating authentication'
        });
      }
    };
  }

  /**
   * Middleware to validate temporary token
   * @returns {Function} Token validation middleware
   */
  validateToken() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          status: 'error',
          code: 'TOKEN_NOT_PROVIDED',
          message: 'Token not provided'
        });
      }

      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, this.JWT_SECRET);

        // Verify token type
        if (decoded.type !== 'ai-api-token') {
          return res.status(401).json({
            status: 'error',
            code: 'INVALID_TOKEN_TYPE',
            message: 'Invalid token type'
          });
        }

        // Store token data in the request object
        req.token = decoded;

        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            status: 'error',
            code: 'TOKEN_EXPIRED',
            message: 'Token expired'
          });
        }

        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            status: 'error',
            code: 'INVALID_TOKEN',
            message: 'Invalid token'
          });
        }

        logger.error('Error validating token', error);

        res.status(500).json({
          status: 'error',
          code: 'AUTHENTICATION_ERROR',
          message: 'Internal error validating authentication'
        });
      }
    };
  }

  /**
   * Middleware to authorize access scope
   * @param {string[]} requiredScopes - Scopes required to access the resource
   * @returns {Function} Authorization middleware
   */
  authorizeScope(requiredScopes = []) {
    return (req, res, next) => {
      // Check if it's a token or API key
      const scopes = req.token?.scopes || req.apiKey?.scopes || [];

      if (requiredScopes.length === 0 || scopes.includes('*')) {
        return next(); // Allow if no specific scopes are required or if '*' scope is present
      }

      const hasRequiredScope = requiredScopes.some(scope => scopes.includes(scope));

      if (!hasRequiredScope) {
        return res.status(403).json({
          status: 'error',
          code: 'INSUFFICIENT_SCOPE',
          message: 'You do not have permission to access this resource'
        });
      }

      next();
    };
  }

  /**
   * Middleware to validate input schema
   * @param {Object} schema - Zod schema for validation
   * @param {string} source - Data source ('body', 'query', 'params')
   * @returns {Function} Validation middleware
   */
  validateInput(schema, source = 'body') {
    return (req, res, next) => {
      try {
        const data = source === 'body' ? req.body :
                     source === 'query' ? req.query :
                     source === 'params' ? req.params : req.body;

        const validatedData = schema.parse(data);

        // Store validated data
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
        if (error.errors) { // Zod validation error
          return res.status(400).json({
            status: 'error',
            code: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }

        // Other errors
        res.status(400).json({
          status: 'error',
          code: 'INVALID_INPUT',
          message: 'Invalid input data'
        });
      }
    };
  }

  /**
   * Generates a temporary token for AI API
   * @param {string} userId - User ID
   * @param {string[]} scopes - Allowed scopes
   * @param {string} expiry - Expiration time
   * @returns {string} JWT token
   */
  generateToken(userId, scopes = ['text'], expiry = null) {
    const tokenId = crypto.randomUUID();

    const payload = {
      jti: tokenId, // JWT ID
      userId,
      type: 'ai-api-token', // Token type
      scopes,
      iat: Math.floor(Date.now() / 1000) // Issued at timestamp
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: expiry || this.TOKEN_EXPIRY
    });
  }

  /**
   * Generates a new API key
   * @param {Object} options - API key options
   * @returns {Object} Object with the API key
   */
  generateApiKey(options) {
    const keyValue = this.API_KEY_PREFIX + this._generateRandomKey();

    return {
      key: keyValue,
      userId: options.userId,
      name: options.name || 'API Key',
      scopes: options.scopes || ['text'], // Default scopes
      allowedOrigins: options.allowedOrigins || [],
      expiresAt: options.expiresAt || null,
      active: true,
      plan: options.plan || 'standard', // Default plan
      createdAt: new Date(),
      lastUsed: null
    };
  }

  /**
   * Middleware to log API usage
   * @returns {Function} Logging middleware
   */
  logUsage() {
    return (req, res, next) => {
      // Set start time
      req.aiApiRequestStart = Date.now();

      // Capture response body
      const originalSend = res.send;

      res.send = function(body) {
        res.body = body; // Store body for logging
        originalSend.call(this, body);
      };

      // Execute when request finishes
      res.on('finish', () => {
        const requestTime = Date.now() - req.aiApiRequestStart;
        const route = req.route?.path || req.path;
        const method = req.method;
        const statusCode = res.statusCode;
        const userId = req.user?.id || req.token?.userId || req.apiKey?.owner || 'anonymous';

        // Log usage
        secureMongoClient.insert('aiApiLogs', {
          userId,
          authenticationType: req.user ? 'session' : (req.token ? 'token' : (req.apiKey ? 'apiKey' : 'none')),
          apiKeyId: req.apiKey?.id,
          tokenId: req.token?.jti,
          route,
          method,
          statusCode,
          requestTime, // Request processing time in ms
          timestamp: new Date(),
          ip: this._maskIP(req.ip), // Mask IP for privacy
          userAgent: req.headers['user-agent'],
          success: statusCode < 400 // Simple success check
        }).catch(error => {
          logger.error('Error logging AI API usage', error);
        });
      });

      next();
    };
  }

  /**
   * Revokes a JWT token
   * @param {string} tokenId - Token ID (jti)
   * @returns {Promise<boolean>} - Indicates if the token was successfully revoked
   */
  async revokeToken(tokenId) {
    try {
      await secureMongoClient.insert('revokedTokens', {
        tokenId,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires after 24 hours for cleanup
      });

      return true;
    } catch (error) {
      logger.error('Error revoking token', error);
      return false;
    }
  }

  /**
   * Checks if a token is revoked
   * @param {string} tokenId - Token ID (jti)
   * @returns {Promise<boolean>} - Indicates if the token is revoked
   */
  async isTokenRevoked(tokenId) {
    try {
      const revoked = await secureMongoClient.findOne('revokedTokens', { tokenId });
      return !!revoked; // Returns true if found, false otherwise
    } catch (error) {
      logger.error('Error checking revoked token', error);
      return false; // Assume not revoked on error to be safe, or handle error differently
    }
  }

  /**
   * Generates a random key for API key
   * @returns {string} Random key
   * @private
   */
  _generateRandomKey() {
    const keyBuffer = crypto.randomBytes(24); // 24 bytes = 192 bits
    return keyBuffer.toString('base64url'); // URL-safe base64
  }

  /**
   * Logs API key usage
   * @param {string} apiKeyId - API key ID
   * @param {object} req - Express request
   * @returns {Promise<void>}
   * @private
   */
  async _logApiKeyUsage(apiKeyId, req) {
    try {
      // Update last used timestamp of the API key
      await secureMongoClient.updateOne('apiKeys',
        { _id: apiKeyId },
        { $set: { lastUsed: new Date() } }
      );

      // Log detailed usage
      await secureMongoClient.insert('apiKeyUsage', {
        apiKeyId,
        route: req.route?.path || req.path,
        method: req.method,
        timestamp: new Date(),
        ip: this._maskIP(req.ip),
        userAgent: req.headers['user-agent']
      });
    } catch (error) {
      logger.error('Error logging API key usage', error);
    }
  }

  /**
   * Masks sensitive data for logs
   * @param {string} data - Data to mask
   * @returns {string} Masked data
   * @private
   */
  _maskSensitiveData(data) {
    if (!data || typeof data !== 'string') {
      return '';
    }
    // Simple masking: show first 4 and last 4 characters
    if (data.length <= 8) {
      return '***'; // Too short to mask meaningfully
    }

    return data.substring(0, 4) + '***' + data.substring(data.length - 4);
  }

  /**
   * Masks IP for logs
   * @param {string} ip - IP address
   * @returns {string} Masked IP
   * @private
   */
  _maskIP(ip) {
    if (!ip) return '';

    // IPv4: Mask last two octets
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.***.***`;
    }

    // IPv6: Mask last four segments (simplified)
    if (ip.includes(':')) {
      const parts = ip.split(':');
      // Show first two segments, mask the rest for simplicity
      return `${parts[0]}:${parts[1]}:***:***:***:***:***:***`.split(':').slice(0, parts.length).join(':');
    }

    return ip; // Return original if not recognized format
  }

  /**
   * Validation schemas for common endpoints
   */
  schemas = {
    /**
     * Schema for text generation
     * @description Validates the input for text generation requests.
     */
    textGeneration: z.object({
      prompt: z.string({ description: "The prompt text for generation." }).min(1, "Prompt cannot be empty.").max(4000, "Prompt exceeds maximum length of 4000 characters."),
      maxTokens: z.number({ description: "Maximum number of tokens to generate." }).int("maxTokens must be an integer.").positive("maxTokens must be positive.").optional(),
      temperature: z.number({ description: "Sampling temperature." }).min(0, "Temperature must be at least 0.").max(1, "Temperature must be at most 1.").optional(),
      options: z.object({
        model: z.string({ description: "Specific model to use for generation." }).optional(),
        stream: z.boolean({ description: "Whether to stream the response." }).optional(),
        stopSequences: z.array(z.string({ description: "Sequences to stop generation at." })).optional()
      }, { description: "Additional generation options." }).optional()
    }),

    /**
     * Schema for image generation
     * @description Validates the input for image generation requests.
     */
    imageGeneration: z.object({
      prompt: z.string({ description: "The prompt text for image generation." }).min(1, "Prompt cannot be empty.").max(1000, "Prompt exceeds maximum length of 1000 characters."),
      negativePrompt: z.string({ description: "Negative prompt to guide generation away from certain concepts." }).max(1000).optional(),
      width: z.number({ description: "Width of the generated image." }).int().min(64).max(1024).optional(),
      height: z.number({ description: "Height of the generated image." }).int().min(64).max(1024).optional(),
      numberOfImages: z.number({ description: "Number of images to generate." }).int().min(1).max(4).optional(),
      options: z.object({
        model: z.string({ description: "Specific model to use for image generation." }).optional(),
        format: z.enum(['jpeg', 'png', 'webp'], { description: "Format of the generated image." }).optional()
      }, { description: "Additional image generation options." }).optional()
    }),

    /**
     * Schema for embedding generation
     * @description Validates the input for embedding generation requests.
     */
    embedding: z.object({
      text: z.string({ description: "Text to generate embeddings for." }).min(1, "Text cannot be empty.").max(8000, "Text exceeds maximum length of 8000 characters."),
      model: z.string({ description: "Specific model to use for embedding generation." }).optional()
    }),

    /**
     * Schema for API key creation
     * @description Validates the input for creating a new API key.
     */
    createApiKey: z.object({
      name: z.string({ description: "A descriptive name for the API key." }).min(1, "API key name cannot be empty.").max(100, "API key name exceeds maximum length of 100 characters."),
      scopes: z.array(z.string({ description: "Scopes or permissions for the API key." })).optional(),
      allowedOrigins: z.array(z.string({ description: "Allowed domains (origins) for the API key." })).optional(),
      expiresAt: z.string({ description: "Expiration date for the API key in ISO 8601 format." }).datetime({ message: "Invalid datetime format for expiresAt." }).optional(),
      plan: z.enum(['standard', 'premium'], { description: "Subscription plan associated with the API key." }).optional()
    })
  };
}

// Create a single instance of the middleware
const aiSecurityMiddleware = new AISecurityMiddleware();

module.exports = aiSecurityMiddleware;
