const { z } = require('zod');
const { Types } = require('mongoose');
const logger = require('../utils/logger');
const config = require('../config/securityConfig');

/**
 * MongoDB validation middleware
 * Provides schema validation and MongoDB-specific security protections
 * Follows OWASP guidelines for NoSQL injection prevention
 */
class MongoValidator {
  /**
   * Create a middleware that validates request data against a Zod schema
   * @param {z.ZodSchema} schema - Zod schema to validate against
   * @param {string} source - Request property to validate ('body', 'query', 'params')
   * @returns {Function} Express middleware
   */
  static validate(schema, source = 'body') {
    return (req, res, next) => {
      try {
        // Parse and validate the request data against the schema
        const validData = schema.parse(req[source]);
        
        // Replace the request data with validated data
        req[source] = validData;
        
        next();
      } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
          logger.warn(`Validation error for ${req.path}: ${JSON.stringify(error.errors)}`);
          
          // Format the errors
          const formattedErrors = error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }));
          
          return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: formattedErrors
          });
        }
        
        // Handle other errors
        logger.error(`Schema validation error: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error during validation'
        });
      }
    };
  }

  /**
   * Create a middleware that validates MongoDB ObjectIds
   * @param {...string} paramNames - Names of parameters to validate
   * @returns {Function} Express middleware
   */
  static validateObjectId(...paramNames) {
    return (req, res, next) => {
      try {
        for (const param of paramNames) {
          let id;
          
          // Check if the ID is in params, query, or body
          if (req.params && req.params[param]) {
            id = req.params[param];
          } else if (req.query && req.query[param]) {
            id = req.query[param];
          } else if (req.body && req.body[param]) {
            id = req.body[param];
          }
          
          // If ID exists, validate it
          if (id) {
            if (!Types.ObjectId.isValid(id)) {
              logger.warn(`Invalid MongoDB ObjectId: ${param}=${id}`);
              return res.status(400).json({
                status: 'error',
                message: `Invalid ID format for ${param}`
              });
            }
          }
        }
        
        next();
      } catch (error) {
        logger.error(`Error validating ObjectId: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error during ID validation'
        });
      }
    };
  }

  /**
   * Create a middleware that sanitizes request data for MongoDB operations
   * Prevents NoSQL injection by escaping special MongoDB operators
   * @param {string} source - Request property to sanitize ('body', 'query', 'params')
   * @returns {Function} Express middleware
   */
  static sanitize(source = 'body') {
    return (req, res, next) => {
      try {
        if (req[source] && typeof req[source] === 'object') {
          // Get MongoDB operators to detect
          const operators = config.SECURITY.NOSQL_INJECTION.MONGO_OPERATORS;
          
          // Flag to track if we found any suspicious operators
          let suspiciousOperators = false;
          
          // Sanitize the request data
          req[source] = this._sanitizeObject(req[source], operators, () => {
            suspiciousOperators = true;
          });
          
          // Log suspicious activity
          if (suspiciousOperators) {
            const clientIp = req.ip || req.connection.remoteAddress;
            logger.warn(`Potential NoSQL injection attempt from ${clientIp} at ${req.path}`);
            
            // If configured to block injection attempts, return an error
            if (config.SECURITY.NOSQL_INJECTION.BLOCK_SUSPICIOUS_REQUESTS) {
              return res.status(403).json({
                status: 'error',
                message: 'Request contains suspicious MongoDB operators'
              });
            }
          }
        }
        
        next();
      } catch (error) {
        logger.error(`Error sanitizing request data: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error during request sanitization'
        });
      }
    };
  }

  /**
   * Recursively sanitize an object to protect against NoSQL injection
   * @param {Object} obj - Object to sanitize
   * @param {string[]} operators - MongoDB operators to detect
   * @param {Function} onFound - Callback when an operator is found
   * @returns {Object} Sanitized object
   * @private
   */
  static _sanitizeObject(obj, operators, onFound) {
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this._sanitizeObject(item, operators, onFound));
    }
    
    // Handle objects
    if (obj !== null && typeof obj === 'object') {
      const sanitized = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Check if the key is a MongoDB operator
        if (key.startsWith('$') && operators.includes(key)) {
          // Call the onFound callback if an operator is found
          onFound();
          
          // Escape the key by prefixing with escaped character
          sanitized[`\\${key}`] = this._sanitizeObject(value, operators, onFound);
        } else {
          // Recursively sanitize the value
          sanitized[key] = this._sanitizeObject(value, operators, onFound);
        }
      }
      
      return sanitized;
    }
    
    // Handle string values (escape MongoDB operators in strings)
    if (typeof obj === 'string') {
      return this._escapeString(obj, operators, onFound);
    }
    
    // Return other primitive values as-is
    return obj;
  }

  /**
   * Escape MongoDB operators in a string
   * @param {string} str - String to escape
   * @param {string[]} operators - MongoDB operators to detect
   * @param {Function} onFound - Callback when an operator is found
   * @returns {string} Escaped string
   * @private
   */
  static _escapeString(str, operators, onFound) {
    let escapedStr = str;
    
    // Check for operators in the string and escape them
    for (const op of operators) {
      if (str.includes(op)) {
        onFound();
        escapedStr = escapedStr.replace(new RegExp(`\\${op}`, 'g'), `\\${op}`);
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
    { message: 'Invalid MongoDB ObjectId format' }
  ),
  
  pagination: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive()
      .max(100) // Prevent excessive data fetching
      .optional().default(20)
  }),
  
  sortOrder: z.enum(['asc', 'desc', '1', '-1']).optional().default('asc'),
  
  query: z.object({
    q: z.string().optional(),
    fields: z.string().optional(),
    ...z.record(z.string(), z.any()).optional()
  }).optional()
};

module.exports = {
  MongoValidator,
  MongoSchemas
}; 