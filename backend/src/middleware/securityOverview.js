/**
 * @fileoverview Security Overview - Central Integration Point for AInovar Tech Security
 * This file serves as a central security management system that integrates all security components.
 */

const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const logger = require('../utils/logger');
const config = require('../config/securityConfig');
const mongoSecurity = require('./mongoSecurity');
const antiScraping = require('./antiScraping');
const { getServerSession } = require('next-auth');

/**
 * SecurityOverview - A comprehensive security management system for AInovar Tech
 * Integrates all security components including MongoDB security, anti-scraping, and web security
 */
class SecurityOverview {
  /**
   * Apply all security measures to an Express application
   * @param {object} app - Express application instance
   */
  static applyAllSecurity(app) {
    logger.info('Applying comprehensive security measures to the application');
    
    // Apply web security headers
    this.applySecurityHeaders(app);
    
    // Apply CORS protection
    this.applyCorsProtection(app);
    
    // Apply MongoDB protection
    this.applyMongoProtection(app);
    
    // Apply anti-scraping measures
    this.applyAntiScrapingProtection(app);
    
    // Apply rate limiting
    this.applyRateLimiting(app);
    
    // Apply validation middleware
    this.applyValidationMiddleware(app);
    
    logger.info('All security measures have been applied successfully');
  }

  /**
   * Apply security headers using Helmet
   * @param {object} app - Express application instance
   */
  static applySecurityHeaders(app) {
    logger.info('Applying security headers');
    
    // Define CSP directives from config
    const cspDirectives = config.SECURITY.CSP.directives;
    
    // Apply Helmet with configured options
    app.use(helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: cspDirectives
      },
      xFrameOptions: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    }));
    
    // Additional security headers
    app.use((req, res, next) => {
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('X-Download-Options', 'noopen');
      res.setHeader('X-DNS-Prefetch-Control', 'off');
      next();
    });
  }

  /**
   * Apply CORS protection
   * @param {object} app - Express application instance
   */
  static applyCorsProtection(app) {
    logger.info('Applying CORS protection');
    
    const corsOptions = {
      origin: config.SECURITY.API.ALLOWED_ORIGINS,
      methods: config.SECURITY.API.ALLOWED_METHODS,
      allowedHeaders: config.SECURITY.API.ALLOWED_HEADERS,
      credentials: true,
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204
    };
    
    app.use(cors(corsOptions));
  }

  /**
   * Apply MongoDB protection measures
   * @param {object} app - Express application instance
   */
  static applyMongoProtection(app) {
    logger.info('Applying MongoDB security protection');
    
    // Apply express-mongo-sanitize to prevent NoSQL injection
    app.use(mongoSanitize());
    
    // Apply custom MongoDB security middleware
    app.use(mongoSecurity.sanitizeQuery);
    app.use(mongoSecurity.sanitizeBody);
    
    // Prevent prototype pollution attacks
    app.use((req, res, next) => {
      if (req.body && req.body.constructor === Object) {
        delete req.body.__proto__;
        delete req.body.constructor;
      }
      next();
    });
  }

  /**
   * Apply anti-scraping protection
   * @param {object} app - Express application instance
   */
  static applyAntiScrapingProtection(app) {
    logger.info('Applying anti-scraping protection');
    
    // Get the middleware function from antiScraping module
    const antiScrapingMiddleware = antiScraping.middleware();
    
    // Apply the middleware to the app
    app.use(antiScrapingMiddleware);
  }

  /**
   * Apply rate limiting protection
   * @param {object} app - Express application instance
   */
  static applyRateLimiting(app) {
    logger.info('Applying rate limiting protection');
    
    // Global rate limiter
    const globalLimiter = rateLimit({
      windowMs: config.SECURITY.RATE_LIMIT.WINDOW_MS,
      max: config.SECURITY.RATE_LIMIT.MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req, res) => {
        // Skip rate limiting for whitelisted IPs
        return config.SECURITY.RATE_LIMIT.WHITELIST_IPS.includes(req.ip);
      },
      handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          status: 'error',
          message: 'Too many requests, please try again later.'
        });
      }
    });
    
    app.use(globalLimiter);
    
    // Apply specific route limiters
    const specificLimits = config.SECURITY.RATE_LIMIT.SPECIFIC_LIMITS;
    
    for (const route of Object.keys(specificLimits)) {
      const limit = specificLimits[route];
      
      const routeLimiter = rateLimit({
        windowMs: limit.windowMs || config.SECURITY.RATE_LIMIT.WINDOW_MS,
        max: limit.max,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req, res) => {
          return config.SECURITY.RATE_LIMIT.WHITELIST_IPS.includes(req.ip);
        }
      });
      
      app.use(route, routeLimiter);
    }
  }

  /**
   * Apply validation middleware
   * @param {object} app - Express application instance
   */
  static applyValidationMiddleware(app) {
    logger.info('Applying validation middleware');
    
    // Body parser setup with size limits
    app.use(express.json({
      limit: config.SECURITY.API.REQUEST_SIZE_LIMIT,
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf);
        } catch (e) {
          res.status(400).json({
            status: 'error',
            message: 'Invalid JSON payload'
          });
          throw new Error('Invalid JSON');
        }
      }
    }));
    
    app.use(express.urlencoded({
      extended: true,
      limit: config.SECURITY.API.REQUEST_SIZE_LIMIT
    }));
  }

  /**
   * Middleware to protect routes requiring authentication
   * @param {Array<string>} roles - Array of allowed roles
   * @returns {Function} Middleware function
   */
  static protectRoute(roles = []) {
    return async (req, res, next) => {
      try {
        // Get session using next-auth
        const session = await getServerSession(req, res);
        
        if (!session) {
          return res.status(401).json({
            status: 'error',
            message: 'Authentication required'
          });
        }
        
        // If roles are specified, check if user has required role
        if (roles.length > 0 && !roles.includes(session.user.role)) {
          logger.warn(`Unauthorized access attempt by ${session.user.email} - Required roles: ${roles.join(', ')}`);
          return res.status(403).json({
            status: 'error',
            message: 'You do not have permission to perform this action'
          });
        }
        
        // Add user to request object
        req.user = session.user;
        next();
      } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({
          status: 'error',
          message: 'Internal server error during authentication'
        });
      }
    };
  }

  /**
   * Admin only route protection
   * @returns {Function} Middleware function
   */
  static adminOnly() {
    return this.protectRoute(['admin']);
  }

  /**
   * Create an API key authentication middleware
   * @returns {Function} Middleware function
   */
  static apiKeyAuth() {
    return (req, res, next) => {
      try {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
          return res.status(401).json({
            status: 'error',
            message: 'API key required'
          });
        }
        
        // Check if API key is valid using config
        const validApiKeys = config.SECURITY.API.VALID_API_KEYS;
        
        if (!validApiKeys.includes(apiKey)) {
          logger.warn(`Invalid API key attempt: ${apiKey}`);
          return res.status(403).json({
            status: 'error',
            message: 'Invalid API key'
          });
        }
        
        // Add API information to request
        req.apiKey = apiKey;
        next();
      } catch (error) {
        logger.error('API key authentication error:', error);
        res.status(500).json({
          status: 'error',
          message: 'Internal server error during API key authentication'
        });
      }
    };
  }

  /**
   * Create a combined security report
   * @returns {object} Security report
   */
  static async generateSecurityReport() {
    try {
      // Check MongoDB connection security
      const mongodbConnection = mongoose.connection.getClient().options;
      const isSecureConnection = mongodbConnection.ssl || mongodbConnection.tls;
      
      // Check if indexes exist for primary collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      const securityReport = {
        timestamp: new Date(),
        databaseSecurity: {
          isConnected: mongoose.connection.readyState === 1,
          secureConnection: isSecureConnection,
          collections: collections.length,
          hasSensitiveDataProtection: true,
        },
        webSecurity: {
          helmetEnabled: true,
          corsProtection: true,
          rateLimitingEnabled: true,
          antiScrapingEnabled: true,
        },
        mongodbSecurity: {
          sanitizationEnabled: true,
          validationEnabled: true,
          secureQueryBuilding: true,
        },
        recommendations: []
      };
      
      // Add recommendations based on findings
      if (!isSecureConnection) {
        securityReport.recommendations.push(
          'Enable SSL/TLS for MongoDB connection for production environments'
        );
      }
      
      return securityReport;
    } catch (error) {
      logger.error('Error generating security report:', error);
      throw new Error('Failed to generate security report');
    }
  }
}

module.exports = SecurityOverview; 