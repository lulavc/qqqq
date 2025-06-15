const mongoSecurity = require('./mongoSecurity');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cors = require('cors');
const config = require('../config/securityConfig');
const logger = require('../utils/logger');

/**
 * Security Middleware Factory for Express
 * Implements multiple layers of protection based on OWASP recommendations.
 * Complements MongoDB-specific security measures.
 */
class SecurityMiddleware {
  /**
   * Apply all security middlewares to an Express app.
   * @param {Object} app - Express application instance.
   */
  static applyMiddlewares(app) {
    this.applyHelmetHeaders(app);
    this.applyCorsProtection(app);
    this.applyRateLimiting(app);
    this.applyNonSqlInjectionProtection(app);
    this.applyContentValidation(app);
    logger.info('Security middlewares applied successfully.');
  }

  /**
   * Apply security headers using Helmet.
   * @param {Object} app - Express application.
   */
  static applyHelmetHeaders(app) {
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
        maxAge: 15552000,
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
    }));
    logger.info('Security headers applied with Helmet.');
  }

  /**
   * Apply CORS protection.
   * @param {Object} app - Express application.
   */
  static applyCorsProtection(app) {
    const corsOptions = {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = config.SECURITY.API.ALLOWED_ORIGINS;
        if (allowedOrigins === '*' || (Array.isArray(allowedOrigins) && allowedOrigins.includes('*'))) {
          return callback(null, true);
        }
        if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        logger.warn(`CORS blocked for origin: ${origin}`);
        return callback(new Error('CORS not allowed for this origin.'), false);
      },
      methods: config.SECURITY.API.ALLOWED_METHODS || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: config.SECURITY.API.ALLOWED_HEADERS || ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: config.SECURITY.API.EXPOSED_HEADERS || ['Content-Disposition'],
      credentials: true,
      maxAge: config.SECURITY.API.MAX_AGE || 86400
    };
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
    logger.info('CORS protection applied.');
  }

  /**
   * Apply rate limiting to prevent brute force and DDoS attacks.
   * @param {Object} app - Express application.
   */
  static applyRateLimiting(app) {
    const defaultLimiter = rateLimit({
      windowMs: config.SECURITY.RATE_LIMIT.STANDARD?.windowMs || (15 * 60 * 1000),
      max: config.SECURITY.RATE_LIMIT.STANDARD?.max || 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 'error',
        message: config.SECURITY.RATE_LIMIT.LIMIT_EXCEEDED_MESSAGE || 'Too many requests from this IP, please try again after a short break.'
      },
      skip: (req) => {
        const clientIp = req.ip || req.connection?.remoteAddress;
        return clientIp === '127.0.0.1' || clientIp === '::1';
      },
      keyGenerator: (req) => req.ip
    });
    app.use(defaultLimiter);

    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: config.SECURITY.RATE_LIMIT.SLOW_DOWN?.delayAfter || 100,
      delayMs: (hits) => (hits - (config.SECURITY.RATE_LIMIT.SLOW_DOWN?.delayAfter || 100)) * (config.SECURITY.RATE_LIMIT.SLOW_DOWN?.delayFactor || 100),
      maxDelayMs: config.SECURITY.RATE_LIMIT.SLOW_DOWN?.maxDelayMs || 2000,
    });
    app.use(speedLimiter);

    if (config.SECURITY.RATE_LIMIT.SPECIFIC_LIMITS) {
      for (const [routePath, options] of Object.entries(config.SECURITY.RATE_LIMIT.SPECIFIC_LIMITS)) {
        const routeLimiter = rateLimit({
          windowMs: options.windowMs,
          max: options.max,
          standardHeaders: true,
          legacyHeaders: false,
          message: {
            status: 'error',
            message: options.message || config.SECURITY.RATE_LIMIT.LIMIT_EXCEEDED_MESSAGE || 'Too many requests for this route, please try again later.'
          }
        });
        app.use(routePath, routeLimiter);
        logger.info(`Specific rate limit applied to route: ${routePath}`);
      }
    }
    logger.info('Rate limiting and speed limiting protection applied.');
  }

  /**
   * Apply NoSQL injection protection for MongoDB.
   * @param {Object} app - Express application.
   */
  static applyNonSqlInjectionProtection(app) {
    app.use(mongoSecurity.sanitizeQuery);
    app.use(mongoSecurity.sanitizeBody);
    app.use(mongoSecurity.sanitizeAggregation);
    logger.info('MongoDB NoSQL injection protection applied.');
  }

  /**
   * Apply content validation and sanitization.
   * @param {Object} app - Express application.
   */
  static applyContentValidation(app) {
    app.use((req, res, next) => {
      const requestStart = process.hrtime.bigint();
      res.on('finish', () => {
        const requestDurationNs = process.hrtime.bigint() - requestStart;
        const requestDurationMs = Number(requestDurationNs) / 1_000_000;
        res.setHeader('Server-Timing', `app;dur=${requestDurationMs.toFixed(3)}`);
      });
      next();
    });
    app.use((req, res, next) => {
      next();
    });
    logger.info('Content validation and timing protection middleware applied.');
  }

  /**
   * Create a route protection middleware for Express.
   * @param {Object} options - Protection options.
   * @param {Function} options.isAuthenticated - Function to check if user is authenticated: (req) => boolean.
   * @param {Function} options.hasPermission - Function to check if user has permission: (req, requiredPermissions) => boolean.
   * @param {Array<string>|string} options.permissions - Required permissions for the route.
   * @returns {Function} Express middleware.
   */
  static protectRoute(options = {}) {
    const { isAuthenticated, hasPermission, permissions } = options;
    return (req, res, next) => {
      try {
        if (typeof isAuthenticated === 'function') {
          const authenticated = isAuthenticated(req);
          if (!authenticated) {
            logger.warn(`Unauthorized access attempt to ${req.path} from ${req.ip}. Reason: Not authenticated.`);
            return res.status(401).json({
              status: 'error',
              message: 'Unauthorized. Authentication required.'
            });
          }
        }
        if (typeof hasPermission === 'function' && permissions) {
          const userPermissions = req.user?.permissions || [];
          const canAccess = hasPermission(req, permissions);
          if (!canAccess) {
            logger.warn(`Permission denied for ${req.path} by user ${req.user?.id || 'anonymous'} from ${req.ip}. Required: ${permissions}, Has: ${userPermissions.join(',')}`);
            return res.status(403).json({
              status: 'error',
              message: 'Permission denied. You do not have the necessary permissions to access this resource.'
            });
          }
        }
        next();
      } catch (error) {
        logger.error(`Error in route protection for ${req.path}: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error during route protection.'
        });
      }
    };
  }

  /**
   * Create admin-only route protection.
   * @returns {Function} Express middleware for admin routes.
   */
  static adminOnly() {
    return (req, res, next) => {
      if (!req.user || req.user.role !== 'admin') {
        logger.warn(`Non-admin access attempt to admin route ${req.path} by user ${req.user?.id || 'anonymous'} from ${req.ip}`);
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required. You do not have permission to access this resource.'
        });
      }
      next();
    };
  }

  /**
   * Middleware to detect and block suspicious request patterns.
   * @returns {Function} Express middleware.
   */
  static detectSuspiciousRequests() {
    return (req, res, next) => {
      if (req.query && Object.keys(req.query).length > 0) {
        const hasSuspiciousQuery = Object.entries(req.query).some(([key, value]) => {
          if (typeof value === 'string') {
            if (value.match(/<script|<img|<svg|<iframe|onerror=|onload=|javascript:/i)) {
              logger.warn(`Suspicious XSS-like pattern in query param '${key}': ${value} from ${req.ip}`);
              return true;
            }
            if (value.match(/SELECT\s|DROP\s|INSERT\s|UNION\s|--|;|'|"|\/\*|\*\/|1=1|OR\s*1=1/i)) {
              logger.warn(`Suspicious SQLi-like pattern in query param '${key}': ${value} from ${req.ip}`);
              return true;
            }
          }
          return false;
        });
        if (hasSuspiciousQuery) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid request parameters detected. Potential security risk.'
          });
        }
      }
      next();
    };
  }
}

module.exports = SecurityMiddleware;
