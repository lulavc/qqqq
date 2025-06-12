const mongoSecurity = require('./mongoSecurity');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cors = require('cors');
const config = require('../config/securityConfig');
const logger = require('../utils/logger');

/**
 * Factory de Middleware de Segurança para Express
 * Implementa múltiplas camadas de proteção baseadas nas recomendações OWASP
 * Complementa as medidas de segurança do MongoDB
 */
class SecurityMiddleware {
  /**
   * Apply all security middlewares to an Express app
   * @param {Object} app - Express application instance
   */
  static applyMiddlewares(app) {
    // Apply each security middleware in the appropriate order
    this.applyHelmetHeaders(app);
    this.applyCorsProtection(app);
    this.applyRateLimiting(app);
    this.applyNonSqlInjectionProtection(app);
    this.applyContentValidation(app);
    
    // Log middleware setup
    logger.info('Security middlewares applied successfully');
  }

  /**
   * Apply security headers using Helmet
   * @param {Object} app - Express application
   */
  static applyHelmetHeaders(app) {
    // Configure security headers based on OWASP recommendations
    app.use(helmet({
      contentSecurityPolicy: {
        directives: config.SECURITY.CSP.directives
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'sameorigin' },
      hsts: {
        maxAge: 15552000, // 180 days
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      originAgentCluster: true,
      permissionsPolicy: {
        features: {
          camera: ["'none'"],
          microphone: ["'none'"],
          geolocation: ["'none'"],
          payment: ["'none'"]
        }
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true
    }));
    
    logger.info('Security headers applied with Helmet');
  }

  /**
   * Apply CORS protection
   * @param {Object} app - Express application
   */
  static applyCorsProtection(app) {
    // Configure CORS based on environment settings
    const corsOptions = {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = config.SECURITY.API.ALLOWED_ORIGINS;
        
        if (allowedOrigins === '*') {
          // Allow any origin in development
          return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
          // Allow specific origin
          return callback(null, true);
        }
        
        // Block disallowed origins
        logger.warn(`CORS blocked for origin: ${origin}`);
        return callback(new Error('CORS not allowed for this origin'), false);
      },
      methods: config.SECURITY.API.ALLOWED_METHODS,
      allowedHeaders: config.SECURITY.API.ALLOWED_HEADERS,
      exposedHeaders: config.SECURITY.API.EXPOSED_HEADERS,
      credentials: true,
      maxAge: config.SECURITY.API.MAX_AGE
    };
    
    // Apply CORS middleware
    app.use(cors(corsOptions));
    
    // Handle preflight requests
    app.options('*', cors(corsOptions));
    
    logger.info('CORS protection applied');
  }

  /**
   * Apply rate limiting to prevent brute force and DDoS attacks
   * @param {Object} app - Express application
   */
  static applyRateLimiting(app) {
    // Default rate limiter
    const defaultLimiter = rateLimit({
      windowMs: config.SECURITY.RATE_LIMIT.DEFAULT_WINDOW_MS,
      max: config.SECURITY.RATE_LIMIT.DEFAULT_LIMIT,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 'error',
        message: config.SECURITY.RATE_LIMIT.LIMIT_EXCEEDED_MESSAGE
      },
      skip: (req) => {
        // Skip rate limiting for trusted IPs (like internal services)
        return req.ip === '127.0.0.1' || req.ip === '::1';
      },
      keyGenerator: (req) => {
        // Use IP address as the default key
        return req.ip;
      }
    });
    
    // Apply default rate limiter to all routes
    app.use(defaultLimiter);
    
    // Add speed limiter to slow down after a threshold
    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 100, // allow 100 requests per 15 minutes, then...
      delayMs: (hits) => hits * 100, // add 100ms of delay per request above 100
      maxDelayMs: 2000, // maximum delay: 2 seconds
    });
    
    app.use(speedLimiter);
    
    // Apply specific rate limiters for sensitive routes
    if (config.SECURITY.RATE_LIMIT.SPECIFIC_LIMITS) {
      for (const [route, options] of Object.entries(config.SECURITY.RATE_LIMIT.SPECIFIC_LIMITS)) {
        const routeLimiter = rateLimit({
          windowMs: options.windowMs,
          max: options.limit,
          standardHeaders: true,
          legacyHeaders: false,
          message: {
            status: 'error',
            message: config.SECURITY.RATE_LIMIT.LIMIT_EXCEEDED_MESSAGE
          }
        });
        
        app.use(route, routeLimiter);
        logger.info(`Specific rate limit applied to route: ${route}`);
      }
    }
    
    logger.info('Rate limiting protection applied');
  }

  /**
   * Apply NoSQL injection protection for MongoDB
   * @param {Object} app - Express application
   */
  static applyNonSqlInjectionProtection(app) {
    // Apply query sanitization to all routes
    app.use(mongoSecurity.sanitizeQuery);
    
    // Apply body sanitization to all routes
    app.use(mongoSecurity.sanitizeBody);
    
    // Apply aggregation pipeline sanitization
    app.use(mongoSecurity.sanitizeAggregation);
    
    logger.info('MongoDB injection protection applied');
  }

  /**
   * Apply content validation and sanitization
   * @param {Object} app - Express application
   */
  static applyContentValidation(app) {
    // Add timing protection (against timing attacks)
    app.use((req, res, next) => {
      const requestStart = process.hrtime.bigint();
      
      // Add timing information to response headers
      res.on('finish', () => {
        const requestDuration = Number(process.hrtime.bigint() - requestStart) / 1000000;
        res.setHeader('Server-Timing', `request;dur=${requestDuration}`);
      });
      
      next();
    });
    
    // Apply XSS protection 
    app.use((req, res, next) => {
      // Set a custom handler to protect against prototype pollution
      Object.freeze(Object.prototype);
      Object.freeze(Array.prototype);
      Object.freeze(Function.prototype);
      
      next();
    });
    
    logger.info('Content validation applied');
  }

  /**
   * Create a route protection middleware for Express
   * @param {Object} options - Protection options
   * @param {Function} options.isAuthenticated - Function to check if user is authenticated
   * @param {Function} options.hasPermission - Function to check if user has permission
   * @returns {Function} Express middleware
   */
  static protectRoute(options = {}) {
    const { isAuthenticated, hasPermission } = options;
    
    return (req, res, next) => {
      try {
        // Check authentication if a validation function is provided
        if (typeof isAuthenticated === 'function') {
          const authenticated = isAuthenticated(req);
          
          if (!authenticated) {
            logger.warn(`Unauthorized access attempt to ${req.path} from ${req.ip}`);
            return res.status(401).json({
              status: 'error',
              message: 'Unauthorized'
            });
          }
        }
        
        // Check permissions if a permission function is provided
        if (typeof hasPermission === 'function') {
          const hasAccess = hasPermission(req);
          
          if (!hasAccess) {
            logger.warn(`Permission denied for ${req.path} from ${req.ip}`);
            return res.status(403).json({
              status: 'error',
              message: 'Permission denied'
            });
          }
        }
        
        // Proceed if all checks pass
        next();
      } catch (error) {
        logger.error(`Error in route protection: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error'
        });
      }
    };
  }
  
  /**
   * Create admin-only route protection
   * @returns {Function} Express middleware for admin routes
   */
  static adminOnly() {
    return (req, res, next) => {
      if (!req.user || req.user.role !== 'admin') {
        logger.warn(`Non-admin access attempt to ${req.path} from ${req.ip}`);
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }
      
      next();
    };
  }
  
  /**
   * Middleware to detect and block suspicious request patterns
   * @returns {Function} Express middleware
   */
  static detectSuspiciousRequests() {
    return (req, res, next) => {
      // Check for suspicious query parameters
      const hasSuspiciousQuery = req.query && Object.keys(req.query).some(key => {
        const value = req.query[key];
        
        // Check for script tags (potential XSS)
        if (typeof value === 'string' && (
          value.includes('<script') || 
          value.includes('javascript:') || 
          value.includes('data:text/html')
        )) {
          return true;
        }
        
        // Check for SQL injection attempts
        if (typeof value === 'string' && (
          value.includes('SELECT ') || 
          value.includes('DROP TABLE') || 
          value.includes('1=1') ||
          value.includes('OR 1=1')
        )) {
          return true;
        }
        
        return false;
      });
      
      if (hasSuspiciousQuery) {
        logger.warn(`Suspicious query parameters detected: ${JSON.stringify(req.query)} from ${req.ip}`);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request parameters'
        });
      }
      
      next();
    };
  }
}

module.exports = SecurityMiddleware; 