/**
 * Configuration for Anti-Scraping system
 */
module.exports = {
  // Thresholds for decision making
  MAX_REQUESTS_PER_MINUTE: 60,      // Maximum requests per minute before suspicion
  SUSPICIOUS_THRESHOLD: 0.75,       // Score threshold to apply challenges
  BAN_THRESHOLD: 0.9,               // Score threshold to temporarily ban
  ENTROPY_THRESHOLD: 3.2,           // Entropy threshold for path analysis
  
  // Storage settings
  SLIDING_WINDOW_SIZE: 100,         // Maximum number of requests to consider for analysis
  IP_EXPIRY_TIME: 86400,            // Time to keep client profiles (24 hours in seconds)
  
  // Challenge settings
  CHALLENGE_LEVELS: 3,              // Number of challenge difficulty levels
  CAPTCHA_SUCCESS_REDUCTION: 0.3,   // How much to reduce suspicion score after passing CAPTCHA
  
  // System settings
  CACHE_CLEANUP_INTERVAL: 3600000,  // Cache cleanup interval (1 hour in ms)
  
  // Paths to exclude from protection
  EXCLUDED_PATHS: [
    '/public/',
    '/images/',
    '/css/',
    '/js/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/health',
    '/api/challenge'  // Challenge verification endpoints
  ],
  
  // IP addresses to whitelist
  WHITELISTED_IPS: [
    '127.0.0.1',
    'localhost',
    // Add trusted IPs here (e.g., company office)
  ],
  
  // Content protection settings
  CONTENT_PROTECTION: {
    // High-value content paths that need extra protection
    HIGH_VALUE_PATHS: [
      '/api/products',
      '/api/prices',
      '/api/services',
      '/api/blog'
    ],
    
    // Time delay for progressive content disclosure (ms)
    DISCLOSURE_DELAY: 800
  },
  
  // Honeypot field configuration
  HONEYPOT: {
    FIELD_NAMES: [
      'website',     // Common name that appears legitimate
      'url',         // Another common field
      'phone-number' // Hyphenated field that bots might fill
    ]
  }
}; 