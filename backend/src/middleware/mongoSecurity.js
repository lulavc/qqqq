const { z } = require('zod');
const logger = require('../utils/logger');
const config = require('../config/securityConfig');

/**
 * MongoDB Security Middleware based on OWASP guidelines
 * Provides protection against NoSQL injection and other MongoDB-specific attacks
 */
class MongoDBSecurityMiddleware {
  /**
   * Sanitize MongoDB query operators in query parameters
   * Prevents NoSQL injection by detecting and neutralizing MongoDB operators
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  sanitizeQuery(req, res, next) {
    try {
      // Check if there are query parameters
      if (req.query && Object.keys(req.query).length > 0) {
        // Detect MongoDB operators in query parameters
        const operators = ['$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', '$or', '$and',
                          '$not', '$nor', '$exists', '$regex', '$where', '$expr', '$jsonSchema',
                          '$mod', '$text', '$all', '$elemMatch', '$size', '$type'];

        let foundOperator = false;
        const sanitizedQuery = {};

        // Traverse all query parameters
        for (const [key, value] of Object.entries(req.query)) {
          // Check if value is string and contains operator
          if (typeof value === 'string') {
            // Check if value starts with a MongoDB operator
            if (operators.some(op => value.includes(op))) {
              foundOperator = true;
              logger.warn(`Possible NoSQL injection detected: ${key}=${value} from IP: ${req.ip}`);
              sanitizedQuery[key] = this._escapeValue(value);
            } else {
              sanitizedQuery[key] = value;
            }
          } else if (typeof value === 'object' && value !== null) {
            // Check if object keys contain MongoDB operators
            const objKeys = Object.keys(value);
            if (objKeys.some(k => operators.includes(k))) {
              foundOperator = true;
              logger.warn(`Possible NoSQL injection detected in object: ${key} from IP: ${req.ip}`);
              sanitizedQuery[key] = this._sanitizeObject(value, operators, () => foundOperator = true );
            } else {
              sanitizedQuery[key] = value;
            }
          } else {
            sanitizedQuery[key] = value;
          }
        }

        // Replace the original query with sanitized query
        req.query = sanitizedQuery;

        // Log potential attack and block if configured
        if (foundOperator && config.SECURITY.BLOCK_NOSQL_INJECTION) {
          logger.warn(`Blocking NoSQL injection attempt from IP: ${req.ip}. Query: ${JSON.stringify(req.query)}`);
          return res.status(400).json({
            error: 'Invalid query parameters. Potential security violation.',
            code: 'SECURITY_VIOLATION'
          });
        }
      }

      // Proceed with the request if no injection or if not blocking
      next();
    } catch (error) {
      logger.error(`Error in NoSQL injection protection: ${error.message}`);
      next();
    }
  }

  /**
   * Sanitize request body for MongoDB operations
   * Prevents NoSQL injection in request bodies
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  sanitizeBody(req, res, next) {
    try {
      // Check if there is a request body
      if (req.body && Object.keys(req.body).length > 0) {
        const operators = ['$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', '$or', '$and',
                          '$not', '$nor', '$exists', '$regex', '$where', '$expr', '$jsonSchema',
                          '$mod', '$text', '$all', '$elemMatch', '$size', '$type'];

        let foundOperatorInBody = false;
        const sanitizedBody = this._sanitizeObject(req.body, operators, (op) => {
          foundOperatorInBody = true;
          logger.warn(`Possible NoSQL injection detected in request body with operator: ${op} from IP: ${req.ip}`);
        });

        // Replace the original body with sanitized body
        req.body = sanitizedBody;

        // Block potential attack if configured
        if (foundOperatorInBody && config.SECURITY.BLOCK_NOSQL_INJECTION) {
          logger.warn(`Blocking NoSQL injection attempt in body from IP: ${req.ip}. Body: ${JSON.stringify(req.body)}`);
          return res.status(400).json({
            error: 'Invalid request body. Potential security violation.',
            code: 'SECURITY_VIOLATION'
          });
        }
      }

      // Proceed with the request
      next();
    } catch (error) {
      logger.error(`Error in NoSQL body sanitization: ${error.message}`);
      next();
    }
  }

  /**
   * Sanitize object recursively
   * @param {Object} obj - Object to sanitize
   * @param {Array} operators - MongoDB operators to check
   * @param {Function} onFound - Callback when operator is found
   * @returns {Object} - Sanitized object
   */
  _sanitizeObject(obj, operators, onFound) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (operators && operators.includes(key)) {
        if (onFound) onFound(key);
        sanitized[this._escapeKey(key)] = this._sanitizeObject(value, operators, onFound);
      }
      else if (value && typeof value === 'object') {
        sanitized[key] = this._sanitizeObject(value, operators, onFound);
      }
      else if (typeof value === 'string') {
        sanitized[key] = this._escapeValue(value);
      }
      else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  _escapeKey(key) {
    if (key.startsWith('$')) {
      return `_escaped_${key.substring(1)}`;
    }
    return key;
  }

  /**
   * Escape potentially dangerous string values
   * @param {string} value - Value to escape
   * @returns {string} - Escaped value
   */
  _escapeValue(value) {
    if (typeof value !== 'string') {
      return value;
    }
    return value.replace(/\$/g, '\u0024');
  }

  /**
   * Validate MongoDB IDs to prevent injection and errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   * @param {string} paramName - Parameter name to validate (default: 'id')
   */
  validateMongoId(paramName = 'id') {
    return (req, res, next) => {
      try {
        const id = req.params[paramName] || req.query[paramName] || (req.body && req.body[paramName]);

        if (id) {
          const objectIdRegex = /^[0-9a-fA-F]{24}$/;

          if (!objectIdRegex.test(id)) {
            logger.warn(`Invalid MongoDB ObjectId format: ${id} for param ${paramName} from IP: ${req.ip}`);
            return res.status(400).json({
              error: `Invalid format for ${paramName}. Expected a 24-character hex string.`,
              code: 'INVALID_ID_FORMAT'
            });
          }
        }
        next();
      } catch (error) {
        logger.error(`Error validating MongoDB ObjectId: ${error.message}`);
        next(error);
      }
    };
  }

  /**
   * Create a Zod schema validator middleware
   * @param {z.ZodTypeAny} schema - Zod schema to validate against
   * @param {string} source - Source of data to validate ('body', 'query', 'params')
   */
  validateSchema(schema, source = 'body') {
    return (req, res, next) => {
      try {
        const dataToValidate = req[source];
        const validatedData = schema.parse(dataToValidate);
        req[source] = validatedData;
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formattedErrors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }));
          logger.warn(`Validation error for ${source} from IP ${req.ip}: ${JSON.stringify(formattedErrors)}`);
          return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: formattedErrors
          });
        }
        logger.error(`Unexpected validation error: ${error.message}`);
        next(error);
      }
    };
  }

  /**
   * Middleware to protect against MongoDB operator injection in aggregation pipelines
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  sanitizeAggregation(req, res, next) {
    try {
      if (req.body && req.body.pipeline && Array.isArray(req.body.pipeline)) {
        const dangerousStages = ['$graphLookup', '$unionWith', '$out', '$merge', '$function', '$where'];
        const securityRisks = req.body.pipeline.filter(stage => {
          const stageKeys = Object.keys(stage);
          return stageKeys.some(key => dangerousStages.includes(key));
        });

        if (securityRisks.length > 0) {
          const riskyStageNames = securityRisks.map(s => Object.keys(s)[0]).join(', ');
          logger.warn(`Potentially dangerous aggregation pipeline from IP ${req.ip} using stages: ${riskyStageNames}`);
          if (config.SECURITY.BLOCK_DANGEROUS_AGGREGATION) {
            logger.warn(`Blocking dangerous aggregation attempt from IP: ${req.ip}. Pipeline: ${JSON.stringify(req.body.pipeline)}`);
            return res.status(403).json({
              error: 'Potentially unsafe aggregation operation detected and blocked.',
              code: 'SECURITY_VIOLATION_AGGREGATION'
            });
          }
        }
      }
      next();
    } catch (error) {
      logger.error(`Error in aggregation pipeline validation: ${error.message}`);
      next(error);
    }
  }
}

// Create singleton instance
const mongoSecurity = new MongoDBSecurityMiddleware();

module.exports = mongoSecurity;
