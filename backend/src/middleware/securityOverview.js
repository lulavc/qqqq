/**
 * @fileoverview Security Overview - Central Integration Point for AInovar Tech Security
 * This file serves as a central security management system that integrates all security components.
 */

const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const express = require('express');
const logger =require('../utils/logger');
const config = require('../config/securityConfig');
const mongoSecurity = require('./mongoSecurity');
const antiScraping = require('./antiScraping');
// const { getServerSession } = require('next-auth');

/**
 * SecurityOverview - A comprehensive security management system for AInovar Tech.
 * Integrates all security components including MongoDB security, anti-scraping, and web security.
 */
class SecurityOverview {
  /**
   * Apply all security measures to an Express application.
   * @param {object} app - Express application instance.
   */
  static applyAllSecurity(app) {
    logger.info('Applying comprehensive security measures to the application.');
    this.applySecurityHeaders(app);
    this.applyCorsProtection(app);
    this.applyMongoProtection(app);
    this.applyAntiScrapingProtection(app);
    this.applyRateLimiting(app);
    this.applyValidationMiddleware(app);
    logger.info('All security measures have been applied successfully.');
  }

  /**
   * Apply security headers using Helmet.
   * @param {object} app - Express application instance.
   */
  static applySecurityHeaders(app) {
    logger.info('Applying security headers using Helmet.');
    const cspDirectives = config.SECURITY.CSP.directives;
    app.use(helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: cspDirectives
      },
      xFrameOptions: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
    }));
    app.use((req, res, next) => {
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('X-Download-Options', 'noopen');
      res.setHeader('X-DNS-Prefetch-Control', 'off');
      next();
    });
  }

  /**
   * Apply CORS protection.
   * @param {object} app - Express application instance.
   */
  static applyCorsProtection(app) {
    logger.info('Applying CORS protection.');
    const corsOptions = {
      origin: config.SECURITY.API.ALLOWED_ORIGINS,
      methods: config.SECURITY.API.ALLOWED_METHODS || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: config.SECURITY.API.ALLOWED_HEADERS || ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: config.SECURITY.API.MAX_AGE || 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204
    };
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
  }

  /**
   * Apply MongoDB protection measures.
   * @param {object} app - Express application instance.
   */
  static applyMongoProtection(app) {
    logger.info('Applying MongoDB security protection.');
    app.use(mongoSanitize());
    app.use((req, res, next) => {
      const body = req.body;
      if (body && typeof body === 'object') {
        if (Object.prototype.hasOwnProperty.call(body, '__proto__') || Object.prototype.hasOwnProperty.call(body, 'constructor')) {
          logger.warn(`Potential prototype pollution attempt from IP: ${req.ip}. Body: ${JSON.stringify(body)}`);
        }
      }
      next();
    });
  }

  /**
   * Apply anti-scraping protection.
   * @param {object} app - Express application instance.
   */
  static applyAntiScrapingProtection(app) {
    logger.info('Applying anti-scraping protection.');
    const antiScrapingMiddlewareInstance = antiScraping.middleware();
    app.use(antiScrapingMiddlewareInstance);
  }

  /**
   * Apply rate limiting protection.
   * @param {object} app - Express application instance.
   */
  static applyRateLimiting(app) {
    logger.info('Applying rate limiting protection.');
    const globalLimiter = rateLimit({
      windowMs: config.SECURITY.RATE_LIMIT.STANDARD?.windowMs || (15 * 60 * 1000),
      max: config.SECURITY.RATE_LIMIT.STANDARD?.max || 100,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req, res) => {
        const clientIp = req.ip || req.connection?.remoteAddress;
        return (config.SECURITY.RATE_LIMIT.WHITELIST_IPS || []).includes(clientIp);
      },
      handler: (req, res ) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
        res.status(429).json({
          status: 'error',
          message: 'Too many requests from this IP, please try again later.'
        });
      }
    });
    app.use(globalLimiter);

    const specificLimits = config.SECURITY.RATE_LIMIT.SPECIFIC_LIMITS;
    if (specificLimits) {
      for (const route of Object.keys(specificLimits)) {
        const limitConfig = specificLimits[route];
        const routeLimiter = rateLimit({
          windowMs: limitConfig.windowMs || config.SECURITY.RATE_LIMIT.STANDARD?.windowMs,
          max: limitConfig.max,
          standardHeaders: true,
          legacyHeaders: false,
          message: limitConfig.message || 'Too many requests for this specific route, please try again later.',
          skip: (req, res) => (config.SECURITY.RATE_LIMIT.WHITELIST_IPS || []).includes(req.ip),
        });
        app.use(route, routeLimiter);
        logger.info(`Specific rate limit applied to route: ${route}`);
      }
    }
  }

  /**
   * Apply validation middleware, including body parsing with size limits.
   * @param {object} app - Express application instance.
   */
  static applyValidationMiddleware(app) {
    logger.info('Applying validation middleware (body parsing with limits).');
    app.use(express.json({
      limit: config.SECURITY.API.REQUEST_SIZE_LIMIT || '1mb',
      verify: (req, res, buf, encoding) => {
        try {
          JSON.parse(buf.toString());
        } catch (e) {
          logger.warn(`Invalid JSON payload received from IP: ${req.ip}. Error: ${e.message}`);
          res.status(400).json({
            status: 'error',
            message: 'Invalid JSON payload. Please ensure your request body is correctly formatted.'
          });
          throw new Error('Invalid JSON');
        }
      }
    }));
    app.use(express.urlencoded({
      extended: true,
      limit: config.SECURITY.API.REQUEST_SIZE_LIMIT || '1mb'
    }));
  }

  /**
   * Middleware to protect routes requiring authentication.
   * @param {Array<string>} roles - Array of allowed roles.
   * @returns {Function} Middleware function.
   */
  static protectRoute(roles = []) {
    return async (req, res, next) => {
      try {
        const session = req.session;
        const user = session?.user;
        if (!user) {
          logger.warn(`Authentication required for ${req.path}, but no user session/token found. IP: ${req.ip}`);
          return res.status(401).json({
            status: 'error',
            message: 'Authentication required. Please log in.'
          });
        }
        if (roles.length > 0) {
          const userRoles = Array.isArray(user.role) ? user.role : [user.role];
          const hasPermission = roles.some(role => userRoles.includes(role));
          if (!hasPermission) {
            logger.warn(`Authorization failed for user ${user.id || user.email} on ${req.path}. Required roles: ${roles.join(', ')}, User roles: ${userRoles.join(',')}. IP: ${req.ip}`);
            return res.status(403).json({
              status: 'error',
              message: 'Forbidden. You do not have the necessary permissions to perform this action.'
            });
          }
        }
        req.user = user;
        next();
      } catch (error) {
        logger.error('Error in protectRoute middleware:', { error: error.message, path: req.path, ip: req.ip });
        res.status(500).json({
          status: 'error',
          message: 'Internal server error during authentication/authorization.'
        });
      }
    };
  }

  /**
   * Admin only route protection.
   * @returns {Function} Middleware function.
   */
  static adminOnly() {
    return this.protectRoute(['admin']);
  }

  /**
   * Create an API key authentication middleware.
   * @returns {Function} Middleware function.
   */
  static apiKeyAuth() {
    return async (req, res, next) => {
      try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
          logger.warn(`API key required for ${req.path}, but none provided. IP: ${req.ip}`);
          return res.status(401).json({
            status: 'error',
            message: 'API key is required for this endpoint.'
          });
        }
        const validApiKeys = config.SECURITY.API.VALID_API_KEYS || [];
        const isKeyValid = validApiKeys.includes(apiKey);
        if (!isKeyValid) {
          logger.warn(`Invalid API key attempt: ${apiKey.substring(0, 5)}... for ${req.path}. IP: ${req.ip}`);
          return res.status(403).json({
            status: 'error',
            message: 'Invalid or unauthorized API key.'
          });
        }
        req.apiKeyInfo = { key: apiKey, source: 'header' };
        next();
      } catch (error) {
        logger.error('API key authentication error:', { error: error.message, path: req.path, ip: req.ip });
        res.status(500).json({
          status: 'error',
          message: 'Internal server error during API key authentication.'
        });
      }
    };
  }

  /**
   * Create a combined security report.
   * @returns {Promise<object>} Security report.
   */
  static async generateSecurityReport() {
    try {
      const isSecureConnection = mongoose.connection.getClient()?.options?.tls || mongoose.connection.getClient()?.options?.ssl || false;
      const collections = await mongoose.connection.db.listCollections().toArray();
      const securityReport = {
        timestamp: new Date().toISOString(),
        application: {
          name: "AInovar Tech Application",
          environment: process.env.NODE_ENV || "development"
        },
        databaseSecurity: {
          isConnected: mongoose.connection.readyState === 1,
          secureConnectionActive: isSecureConnection,
          totalCollections: collections.length,
          sensitiveDataProtectionMeasures: "Review Manually"
        },
        webSecurity: {
          helmetHeadersApplied: true,
          corsProtectionEnabled: true,
          rateLimitingActive: true,
          antiScrapingActive: true
        },
        mongodbSpecificSecurity: {
          nosqlInjectionSanitization: true,
          schemaValidationInPlace: "Partial/Review Manually",
          secureQueryPractices: "Review Manually"
        },
        recommendations: []
      };
      if (!isSecureConnection && process.env.NODE_ENV === 'production') {
        securityReport.recommendations.push(
          'Critical: Enable SSL/TLS for MongoDB connection in production environments.'
        );
      }
      if (process.env.NODE_ENV !== 'production' && (config.SECURITY.API.ALLOWED_ORIGINS === '*' || (Array.isArray(config.SECURITY.API.ALLOWED_ORIGINS) && config.SECURITY.API.ALLOWED_ORIGINS.includes('*')))) {
         securityReport.recommendations.push(
          'Security Advisory: CORS is configured to allow all origins. Restrict this in production.'
        );
      }
      logger.info('Security report generated successfully.');
      return securityReport;
    } catch (error) {
      logger.error('Error generating security report:', { error: error.message });
      return {
        error: true,
        message: 'Failed to generate complete security report.',
        detail: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = SecurityOverview;
