const { z } = require('zod');
const { Types } = require('mongoose');
const logger = require('../utils/logger');
const config = require('../config/securityConfig');

/**
 * MongoDB validation middleware
 * Provides schema validation and MongoDB-specific security protections.
 * Follows OWASP guidelines for NoSQL injection prevention.
 */
class MongoValidator {
  /**
   * Create a middleware that validates request data against a Zod schema.
   * @param {z.ZodSchema<any>} schema - Zod schema to validate against.
   * @param {string} source - Request property to validate ('body', 'query', 'params'). Defaults to 'body'.
   * @returns {Function} Express middleware.
   */
  static validate(schema, source = 'body') {
    return (req, res, next) => {
      try {
        const validData = schema.parse(req[source]);
        req[source] = validData;
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.warn(`Validation error for ${req.path} in ${source}: ${JSON.stringify(error.errors)} from IP: ${req.ip}`);
          const formattedErrors = error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }));
          return res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            errors: formattedErrors
          });
        }
        logger.error(`Schema validation error in ${source} for ${req.path}: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error during validation.'
        });
      }
    };
  }

  /**
   * Create a middleware that validates MongoDB ObjectIds.
   * @param {...string} paramNames - Names of parameters to validate from req.params, req.query, or req.body.
   * @returns {Function} Express middleware.
   */
  static validateObjectId(...paramNames) {
    return (req, res, next) => {
      try {
        for (const param of paramNames) {
          let id;
          if (req.params && req.params[param]) {
            id = req.params[param];
          } else if (req.query && req.query[param]) {
            id = req.query[param];
          } else if (req.body && req.body[param]) {
            id = req.body[param];
          }

          if (id !== undefined && id !== null) {
            if (!Types.ObjectId.isValid(id)) {
              logger.warn(`Invalid MongoDB ObjectId for param '${param}': ${id} from IP: ${req.ip}`);
              return res.status(400).json({
                status: 'error',
                message: `Invalid ID format for parameter '${param}'. Expected a 24-character hexadecimal string.`
              });
            }
          }
        }
        next();
      } catch (error) {
        logger.error(`Error validating ObjectId: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error during ID validation.'
        });
      }
    };
  }

  /**
   * Create a middleware that sanitizes request data for MongoDB operations.
   * Prevents NoSQL injection by escaping special MongoDB operators.
   * @param {string} source - Request property to sanitize ('body', 'query', 'params'). Defaults to 'body'.
   * @returns {Function} Express middleware.
   */
  static sanitize(source = 'body') {
    return (req, res, next) => {
      try {
        if (req[source] && typeof req[source] === 'object') {
          const operators = config.SECURITY.NOSQL_INJECTION?.MONGO_OPERATORS ||
                            ['$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', '$or', '$and',
                             '$not', '$nor', '$exists', '$regex', '$where', '$expr', '$jsonSchema',
                             '$mod', '$text', '$all', '$elemMatch', '$size', '$type'];
          let suspiciousOperatorsFound = false;
          req[source] = this._sanitizeObject(req[source], operators, () => {
            suspiciousOperatorsFound = true;
          });

          if (suspiciousOperatorsFound) {
            const clientIp = req.ip || req.connection?.remoteAddress;
            logger.warn(`Potential NoSQL injection attempt detected in ${source} from ${clientIp} at ${req.path}`);
            if (config.SECURITY.NOSQL_INJECTION?.BLOCK_SUSPICIOUS_REQUESTS) {
              return res.status(403).json({
                status: 'error',
                message: 'Request contains suspicious characters or patterns and has been blocked.'
              });
            }
          }
        }
        next();
      } catch (error) {
        logger.error(`Error sanitizing request data in ${source}: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error during request sanitization.'
        });
      }
    };
  }

  /**
   * Recursively sanitize an object to protect against NoSQL injection.
   * @param {any} obj - Object to sanitize.
   * @param {string[]} operators - MongoDB operators to detect.
   * @param {Function} onFound - Callback when an operator is found.
   * @returns {any} Sanitized object.
   * @private
   */
  static _sanitizeObject(obj, operators, onFound) {
    if (Array.isArray(obj)) {
      return obj.map(item => this._sanitizeObject(item, operators, onFound));
    }
    if (obj !== null && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$') && operators.includes(key)) {
          onFound();
          sanitized[`_escaped_${key.substring(1)}`] = this._sanitizeObject(value, operators, onFound);
        } else {
          sanitized[key] = this._sanitizeObject(value, operators, onFound);
        }
      }
      return sanitized;
    }
    if (typeof obj === 'string') {
      return obj;
    }
    return obj;
  }

  /**
   * Escape MongoDB operators in a string.
   * @param {string} str - String to escape.
   * @param {string[]} operators - MongoDB operators to detect.
   * @param {Function} onFound - Callback when an operator is found.
   * @returns {string} Escaped string.
   * @private
   */
  static _escapeString(str, operators, onFound) {
    let escapedStr = str;
    for (const op of operators) {
      if (str.includes(op)) {
        onFound();
        escapedStr = escapedStr.replace(new RegExp(op.replace(/[.*+?^${}()|[\]\]/g, '\$&'), 'g'), `_escaped_${op}`);
      }
    }
    return escapedStr;
  }
}

/**
 * Common Zod schemas for MongoDB
 */
const MongoSchemas = {
  objectId: z.string().refine(
    (val) => Types.ObjectId.isValid(val),
    { message: 'Invalid MongoDB ObjectId format. Expected a 24-character hexadecimal string.' }
  ),
  pagination: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive()
      .max(100)
      .optional().default(20),
    sortField: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
  }),
  baseQuery: z.object({
    q: z.string().optional().describe("Search query string"),
    fields: z.string().optional().describe("Comma-separated list of fields to return"),
  }).catchall(z.string().optional())
};

module.exports = {
  MongoValidator,
  MongoSchemas
};
