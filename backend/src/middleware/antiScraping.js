const Redis = require('ioredis');
const { parse } = require('ua-parser-js');
const { 
  calculateSuspiciousScore, 
  determineChallenge, 
  calculateBanDuration 
} = require('../utils/scrapingDetection');
const config = require('../config/antiScrapingConfig');
const logger = require('../utils/logger');

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Anti-scraping middleware for Express
 * Detects and prevents scraping attempts using behavior analysis
 */
class AntiScrapingMiddleware {
  constructor() {
    this.clientProfiles = new Map();
  }

  /**
   * Get Redis key for client profile
   * @param {string} ip - Client IP address
   */
  getClientKey(ip) {
    return `anti_scrape:client:${ip}`;
  }

  /**
   * Load client profile from Redis or create new one
   * @param {string} ip - Client IP address
   * @param {string} userAgent - User agent string
   */
  async loadProfile(ip, userAgent) {
    const key = this.getClientKey(ip);
    let profile = null;
    
    try {
      const profileData = await redis.get(key);
      
      if (profileData) {
        const data = JSON.parse(profileData);
        profile = {
          ip,
          userAgent,
          requestTimes: data.requestTimes || [],
          pathsVisited: data.pathsVisited || [],
          mouseMovements: data.mouseMovements || 0,
          cookiesEnabled: data.cookiesEnabled || false,
          jsEnabled: data.jsEnabled || false,
          challengeSuccesses: data.challengeSuccesses || 0,
          challengeFailures: data.challengeFailures || 0,
          lastSeen: data.lastSeen || Date.now(),
          totalRequests: data.totalRequests || 0,
          suspiciousScore: data.suspiciousScore || 0,
          bannedUntil: data.bannedUntil || null
        };
      } else {
        profile = {
          ip,
          userAgent,
          requestTimes: [],
          pathsVisited: [],
          mouseMovements: 0,
          cookiesEnabled: false,
          jsEnabled: false,
          challengeSuccesses: 0,
          challengeFailures: 0,
          lastSeen: Date.now(),
          totalRequests: 0,
          suspiciousScore: 0,
          bannedUntil: null
        };
      }
      
      // Keep in local cache
      this.clientProfiles.set(ip, profile);
      return profile;
      
    } catch (error) {
      logger.error(`Error loading client profile for ${ip}: ${error.message}`);
      // Return default profile if error occurs
      return {
        ip,
        userAgent,
        requestTimes: [],
        pathsVisited: [],
        mouseMovements: 0,
        cookiesEnabled: false,
        jsEnabled: false,
        challengeSuccesses: 0,
        challengeFailures: 0,
        lastSeen: Date.now(),
        totalRequests: 0,
        suspiciousScore: 0,
        bannedUntil: null
      };
    }
  }

  /**
   * Save client profile to Redis
   * @param {Object} profile - Client profile object
   */
  async saveProfile(profile) {
    const key = this.getClientKey(profile.ip);
    
    try {
      // Limit array sizes to prevent Redis memory issues
      const limitedProfile = {
        ...profile,
        requestTimes: profile.requestTimes.slice(-config.SLIDING_WINDOW_SIZE),
        pathsVisited: profile.pathsVisited.slice(-config.SLIDING_WINDOW_SIZE)
      };
      
      await redis.setex(
        key, 
        config.IP_EXPIRY_TIME, 
        JSON.stringify(limitedProfile)
      );
      
    } catch (error) {
      logger.error(`Error saving client profile for ${profile.ip}: ${error.message}`);
    }
  }

  /**
   * Main middleware function for Express
   */
  middleware() {
    return async (req, res, next) => {
      // Skip for allowed paths
      if (config.EXCLUDED_PATHS.some(path => req.path.includes(path))) {
        return next();
      }
      
      // Skip for whitelisted IPs
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (config.WHITELISTED_IPS.includes(clientIp)) {
        return next();
      }
      
      // Extract request data
      const requestData = {
        ip: clientIp,
        userAgent: req.headers['user-agent'] || '',
        path: req.path,
        referer: req.headers.referer || '',
        cookies: req.cookies || {},
        headers: req.headers || {}
      };
      
      try {
        // Analyze request
        const result = await this.analyzeRequest(requestData);
        
        // Store result for routes to access
        req.antiScrapeResult = result;
        
        if (!result.allow) {
          // Client is banned or rate limited
          return res.status(429).json({
            error: 'Muitas requisições detectadas. Acesso temporariamente restrito.',
            code: 'RATE_LIMITED',
            retryAfter: Math.ceil((result.bannedUntil - Date.now()) / 1000)
          });
        }
        
        // Challenge needed but proceed with request
        if (result.challengeType) {
          res.set('X-Challenge-Required', result.challengeType);
        }
        
        next();
        
      } catch (error) {
        logger.error(`Anti-scraping middleware error: ${error.message}`);
        next(); // Continue on error to not disrupt normal operation
      }
    };
  }

  /**
   * Analyze request to determine if it's a scraper
   * @param {Object} requestData - Request data for analysis
   */
  async analyzeRequest(requestData) {
    const { ip, userAgent, path } = requestData;
    
    // Load client profile
    const profile = await this.loadProfile(ip, userAgent);
    
    // Check if client is banned
    if (profile.bannedUntil && Date.now() < profile.bannedUntil) {
      return { 
        allow: false, 
        challengeType: null, 
        score: 100, 
        bannedUntil: profile.bannedUntil 
      };
    }
    
    // Record request information
    const currentTime = Date.now();
    
    // Calculate time between requests
    if (profile.lastSeen > 0) {
      const timeDiff = (currentTime - profile.lastSeen) / 1000; // Convert to seconds
      if (timeDiff > 0) {
        profile.requestTimes.push(timeDiff);
      }
    }
    
    // Update profile data
    profile.lastSeen = currentTime;
    profile.totalRequests++;
    profile.pathsVisited.push(path);
    
    // Update client-side info
    profile.cookiesEnabled = Object.keys(requestData.cookies).length > 0;
    profile.jsEnabled = requestData.headers['x-js-enabled'] === 'true';
    
    // Calculate suspicious score
    const suspiciousScore = calculateSuspiciousScore(profile, requestData);
    profile.suspiciousScore = suspiciousScore;
    
    // Decision based on score
    let challengeType = null;
    let allow = true;
    let bannedUntil = null;
    
    if (suspiciousScore >= config.BAN_THRESHOLD) {
      // Temporarily ban
      const banDuration = calculateBanDuration(profile);
      bannedUntil = currentTime + banDuration;
      profile.bannedUntil = bannedUntil;
      allow = false;
      
      // Log ban
      logger.warn(`IP ${ip} banned for scraping. Score: ${suspiciousScore}, Duration: ${banDuration/1000}s`);
      
    } else if (suspiciousScore >= config.SUSPICIOUS_THRESHOLD) {
      // Apply challenge
      challengeType = determineChallenge(profile);
      allow = true; // Allow but with challenge
      
      logger.info(`Challenge ${challengeType} applied to IP ${ip}. Score: ${suspiciousScore}`);
    }
    
    // Save updated profile
    await this.saveProfile(profile);
    
    // Convert score to 0-100 scale
    const scoreInt = Math.round(suspiciousScore * 100);
    
    return { 
      allow, 
      challengeType, 
      score: scoreInt,
      bannedUntil
    };
  }

  /**
   * Record challenge result
   * @param {string} ip - Client IP address
   * @param {boolean} success - Whether challenge was successful
   */
  async recordChallengeResult(ip, success) {
    try {
      // Get profile
      let profile = this.clientProfiles.get(ip);
      
      if (!profile) {
        const key = this.getClientKey(ip);
        const profileData = await redis.get(key);
        
        if (!profileData) {
          return false;
        }
        
        profile = await this.loadProfile(ip, "");
      }
      
      // Update challenge stats
      if (success) {
        profile.challengeSuccesses++;
        // Reduce suspicious score on success
        profile.suspiciousScore = Math.max(0, profile.suspiciousScore - 0.2);
      } else {
        profile.challengeFailures++;
        // Increase suspicious score on failure
        profile.suspiciousScore = Math.min(1, profile.suspiciousScore + 0.2);
      }
      
      // Save updated profile
      await this.saveProfile(profile);
      return true;
      
    } catch (error) {
      logger.error(`Error recording challenge result for ${ip}: ${error.message}`);
      return false;
    }
  }

  /**
   * Update mouse movement count for an IP
   * @param {string} ip - Client IP address
   * @param {number} count - Number of movements to add
   */
  async updateMouseMovements(ip, count) {
    try {
      let profile = this.clientProfiles.get(ip);
      
      if (!profile) {
        const key = this.getClientKey(ip);
        const profileData = await redis.get(key);
        
        if (!profileData) {
          return false;
        }
        
        profile = await this.loadProfile(ip, "");
      }
      
      profile.mouseMovements += count;
      await this.saveProfile(profile);
      return true;
      
    } catch (error) {
      logger.error(`Error updating mouse movements for ${ip}: ${error.message}`);
      return false;
    }
  }
}

// Singleton instance
const antiScraping = new AntiScrapingMiddleware();

module.exports = antiScraping; 