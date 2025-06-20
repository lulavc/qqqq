/**
 * Middleware to ensure proper UTF-8 encoding throughout the application
 * Prevents encoding problems with Portuguese characters
 */

const utf8 = require('utf8');

/**
 * Middleware to validate and correct UTF-8 encoding
 */
const ensureUTF8Encoding = (req, res, next) => {
  try {
    // Configure response headers for UTF-8
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Accept-Charset', 'utf-8');

    // Validate and correct encoding of the request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObjectEncoding(req.body);
    }

    // Validate query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObjectEncoding(req.query);
    }

    // Validate URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObjectEncoding(req.params);
    }

    next();
  } catch (error) {
    console.error('Error in encoding middleware:', error);
    res.status(400).json({
      success: false,
      message: 'Character encoding error. Verify that you are using UTF-8.',
      error: 'ENCODING_ERROR'
    });
  }
};

/**
 * Recursively sanitizes an object to ensure correct UTF-8 encoding
 */
function sanitizeObjectEncoding(obj) {
  if (typeof obj === 'string') {
    return sanitizeStringEncoding(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectEncoding(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeStringEncoding(key);
      sanitized[sanitizedKey] = sanitizeObjectEncoding(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitizes a string to ensure correct UTF-8 encoding
 */
function sanitizeStringEncoding(str) {
  if (typeof str !== 'string') return str;

  try {
    // Remove invalid control characters
    let cleaned = str.replace(/[ --]/g, '');

    // Check if it's already valid UTF-8
    if (isValidUTF8(cleaned)) {
      return cleaned;
    }

    // Try to decode as UTF-8
    try {
      cleaned = utf8.decode(cleaned);
    } catch (e) {
      // If it fails, try other strategies
      cleaned = Buffer.from(cleaned, 'binary').toString('utf8');
    }

    return cleaned;
  } catch (error) {
    console.warn('Error sanitizing string:', error);
    return str;
  }
}

/**
 * Checks if a string is valid UTF-8
 */
function isValidUTF8(str) {
  try {
    return str === Buffer.from(str, 'utf8').toString('utf8');
  } catch (e) {
    return false;
  }
}

/**
 * Middleware to intercept responses and ensure correct encoding
 */
const ensureUTF8Response = (req, res, next) => {
  // Intercept the json method
  const originalJson = res.json;

  res.json = function(data) {
    // Ensure the response is in UTF-8
    if (data && typeof data === 'object') {
      data = sanitizeObjectEncoding(data);
    }

    // Set correct headers
    this.setHeader('Content-Type', 'application/json; charset=utf-8');

    return originalJson.call(this, data);
  };

  // Intercept the send method
  const originalSend = res.send;

  res.send = function(data) {
    if (typeof data === 'string') {
      data = sanitizeStringEncoding(data);
      this.setHeader('Content-Type', 'text/html; charset=utf-8');
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Utility to validate Portuguese text
 */
const validatePortugueseText = (text) => {
  if (typeof text !== 'string') return true;

  // Special characters of Brazilian Portuguese
  const portugueseChars = /[àáâãäéêëíîïóôõöúûüç]/i;
  const hasPortuguese = portugueseChars.test(text);

  if (hasPortuguese) {
    // Check if characters are being displayed correctly
    const problematicPattern = /[��]/g; // Replacement character, often indicates encoding issues
    if (problematicPattern.test(text)) {
      return false;
    }
  }

  return true;
};

module.exports = {
  ensureUTF8Encoding,
  ensureUTF8Response,
  sanitizeObjectEncoding,
  sanitizeStringEncoding,
  validatePortugueseText,
  isValidUTF8
};
