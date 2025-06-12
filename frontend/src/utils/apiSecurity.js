import { z } from 'zod';

/**
 * Client-side API security utilities for MongoDB requests
 * Implements validation and sanitization before sending data to the server
 * Follows OWASP security guidelines
 */
class ApiSecurity {
  /**
   * Sanitize query parameters to prevent NoSQL injection
   * @param {Object} params - Query parameters object
   * @returns {Object} Sanitized parameters
   */
  static sanitizeQueryParams(params) {
    if (!params || typeof params !== 'object') {
      return {};
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(params)) {
      // Skip null or undefined values
      if (value === null || value === undefined) {
        continue;
      }
      
      // Handle arrays (like for $in operator)
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item => this._sanitizeValue(item));
        continue;
      }
      
      // Handle objects
      if (typeof value === 'object') {
        sanitized[key] = this.sanitizeQueryParams(value);
        continue;
      }
      
      // Handle primitive values
      sanitized[key] = this._sanitizeValue(value);
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize request body for MongoDB operations
   * @param {Object} body - Request body object
   * @returns {Object} Sanitized body
   */
  static sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
      return {};
    }
    
    return this._sanitizeObject(body);
  }
  
  /**
   * Validate data against a Zod schema before sending to the server
   * @param {Object} data - Data to validate
   * @param {z.ZodSchema} schema - Zod schema to validate against
   * @returns {Object} Validated data
   * @throws {Error} If validation fails
   */
  static validateWithSchema(data, schema) {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format the validation errors
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        // Throw a more helpful error
        const errorMessage = `Validation failed: ${formattedErrors.map(e => `${e.path}: ${e.message}`).join(', ')}`;
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  }
  
  /**
   * Validate MongoDB ObjectId format
   * @param {string} id - ID to validate
   * @returns {boolean} True if ID is valid
   */
  static isValidObjectId(id) {
    if (!id || typeof id !== 'string') {
      return false;
    }
    
    // MongoDB ObjectId format validation
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
  
  /**
   * Build a safe query string from parameters
   * @param {Object} params - Query parameters
   * @returns {string} URL-encoded query string
   */
  static buildQueryString(params) {
    if (!params || typeof params !== 'object') {
      return '';
    }
    
    // Sanitize the params first
    const sanitizedParams = this.sanitizeQueryParams(params);
    
    // Build query string using URLSearchParams
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(sanitizedParams)) {
      if (value === null || value === undefined) {
        continue;
      }
      
      if (Array.isArray(value)) {
        // Handle arrays by joining with commas
        searchParams.append(key, value.join(','));
      } else if (typeof value === 'object') {
        // Handle objects by stringifying
        searchParams.append(key, JSON.stringify(value));
      } else {
        // Handle primitive values
        searchParams.append(key, String(value));
      }
    }
    
    return searchParams.toString();
  }
  
  /**
   * Apply security measures to API requests
   * @param {RequestInit} requestOptions - Fetch API request options
   * @param {Object} data - Request data (body or query params)
   * @param {z.ZodSchema} schema - Optional Zod schema for validation
   * @returns {RequestInit} Secured request options
   */
  static secureRequest(requestOptions = {}, data = {}, schema = null) {
    // Create a copy of request options
    const securedOptions = { ...requestOptions };
    
    // Set secure headers
    securedOptions.headers = {
      ...securedOptions.headers,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',  // Helps prevent CSRF
    };
    
    // Validate with schema if provided
    const validatedData = schema 
      ? this.validateWithSchema(data, schema) 
      : data;
    
    // Sanitize request body for POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(securedOptions.method)) {
      securedOptions.body = JSON.stringify(
        this.sanitizeRequestBody(validatedData)
      );
    }
    
    return securedOptions;
  }
  
  /**
   * Create a fetch wrapper with security measures
   * @param {string} baseUrl - API base URL
   * @returns {Function} Secured fetch function
   */
  static createSecureFetch(baseUrl = '') {
    return async (endpoint, options = {}) => {
      const {
        method = 'GET',
        data = {},
        schema = null,
        params = {},
        ...fetchOptions
      } = options;
      
      // Build the URL with query parameters for GET requests
      let url = `${baseUrl}${endpoint}`;
      if (method === 'GET' && Object.keys(params).length > 0) {
        const queryString = this.buildQueryString(params);
        url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
      
      // Apply security measures to request options
      const securedOptions = this.secureRequest(
        { ...fetchOptions, method },
        data,
        schema
      );
      
      try {
        const response = await fetch(url, securedOptions);
        
        // Handle errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: 'Network error occurred'
          }));
          
          throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    };
  }
  
  /**
   * Sanitize a single value to prevent NoSQL injection
   * @param {any} value - Value to sanitize
   * @returns {any} Sanitized value
   * @private
   */
  static _sanitizeValue(value) {
    // Don't try to sanitize non-string values
    if (typeof value !== 'string') {
      return value;
    }
    
    // Prevent MongoDB operator injection in string values
    return value.replace(/\$/g, '\\$').replace(/\./g, '\\.');
  }
  
  /**
   * Recursively sanitize an object to prevent NoSQL injection
   * @param {Object} obj - Object to sanitize
   * @returns {Object} Sanitized object
   * @private
   */
  static _sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this._sanitizeObject(item));
    }
    
    // Handle objects
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize keys that might contain MongoDB operators
      const sanitizedKey = key.startsWith('$') ? `\\${key}` : key;
      
      // Recursively sanitize values
      if (value === null || value === undefined) {
        sanitized[sanitizedKey] = value;
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = this._sanitizeObject(value);
      } else if (typeof value === 'string') {
        sanitized[sanitizedKey] = this._sanitizeValue(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
    
    return sanitized;
  }
}

/**
 * Common Zod schemas for MongoDB API requests
 */
export const MongoSchemas = {
  objectId: z.string().refine(
    (val) => ApiSecurity.isValidObjectId(val),
    { message: 'Invalid MongoDB ObjectId format' }
  ),
  
  pagination: z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20)
  }).optional().default({}),
  
  sortOrder: z.enum(['asc', 'desc', '1', '-1']).optional().default('asc'),
  
  query: z.object({
    q: z.string().optional(),
    fields: z.string().optional()
  }).passthrough().optional().default({})
};

export default ApiSecurity; 