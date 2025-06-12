const { parse } = require('ua-parser-js');
const config = require('../config/antiScrapingConfig');
const stats = require('simple-statistics');
const logger = require('./logger');

/**
 * Calculate suspicious score based on multiple factors
 * @param {Object} profile - User profile with behavior data
 * @param {Object} requestData - Current request data
 * @returns {number} - Score between 0-1 (higher = more suspicious)
 */
function calculateSuspiciousScore(profile, requestData) {
  const scores = [];
  
  // 1. Request interval analysis
  if (profile.requestTimes.length >= 5) {
    const timeIntervals = profile.requestTimes.slice(-20); // Use last 20 intervals
    
    // Calculate statistics
    try {
      const meanInterval = stats.mean(timeIntervals);
      const stdInterval = stats.standardDeviation(timeIntervals);
      
      // Very short intervals are suspicious
      if (meanInterval < 0.2) { // < 200ms between requests
        scores.push(0.9);
      } else if (meanInterval < 1.0) { // < 1s between requests
        scores.push(0.7);
      } else if (meanInterval < 3.0) { // < 3s between requests
        scores.push(0.5);
      } else {
        scores.push(0.1);
      }
      
      // Low standard deviation indicates automated behavior
      if (timeIntervals.length > 5 && stdInterval < 0.1) {
        scores.push(0.95);
      } else if (stdInterval < 0.5) {
        scores.push(0.7);
      } else {
        scores.push(0.1);
      }
    } catch (error) {
      logger.error(`Error calculating time interval statistics: ${error.message}`);
    }
  }
  
  // 2. Navigation pattern analysis (path entropy)
  if (profile.pathsVisited.length >= 5) {
    try {
      // Count frequency of paths
      const pathCounts = {};
      for (const path of profile.pathsVisited.slice(-30)) { // Last 30 paths
        pathCounts[path] = (pathCounts[path] || 0) + 1;
      }
      
      // Calculate path entropy (measure of randomness)
      const totalPaths = profile.pathsVisited.length;
      const probabilities = Object.values(pathCounts).map(count => count / totalPaths);
      
      // Shannon entropy calculation
      const entropy = -probabilities.reduce(
        (sum, prob) => sum + prob * Math.log2(prob),
        0
      );
      
      // Low entropy indicates repetitive behavior (scraping)
      if (entropy < config.ENTROPY_THRESHOLD) {
        const entropyScore = 1.0 - (entropy / config.ENTROPY_THRESHOLD);
        scores.push(entropyScore);
      } else {
        scores.push(0.1);
      }
    } catch (error) {
      logger.error(`Error calculating path entropy: ${error.message}`);
    }
  }
  
  // 3. User-Agent analysis
  const uaScore = analyzeUserAgent(profile.userAgent);
  scores.push(uaScore);
  
  // 4. Browser capability checks
  if (!profile.cookiesEnabled) {
    scores.push(0.8); // No cookies is suspicious
  }
  
  if (!profile.jsEnabled) {
    scores.push(0.8); // No JavaScript is suspicious
  }
  
  // 5. Mouse movement analysis
  if (profile.totalRequests > 5 && profile.mouseMovements < profile.totalRequests * 0.1) {
    scores.push(0.9); // Very little mouse movement is suspicious
  }
  
  // 6. Request pattern analysis
  const patternScore = analyzeRequestPattern(profile);
  if (patternScore > 0) {
    scores.push(patternScore);
  }
  
  // 7. Referer analysis
  const refererScore = analyzeReferer(requestData.referer, profile.pathsVisited);
  if (refererScore > 0) {
    scores.push(refererScore);
  }
  
  // Combine scores with weighting
  if (scores.length > 0) {
    // Sort scores in descending order
    scores.sort((a, b) => b - a);
    
    // Weight calculation - give more weight to highest scores
    if (scores.length >= 3) {
      const weightedScore = (
        scores[0] * 0.5 + 
        scores[1] * 0.3 + 
        scores.slice(2).reduce((sum, score) => sum + score, 0) / scores.slice(2).length * 0.2
      );
      
      // Adjust based on challenge history
      if (profile.challengeFailures > 0) {
        const challengeFactor = Math.min(
          profile.challengeFailures / (profile.challengeSuccesses + 1), 
          1.0
        );
        return Math.min(weightedScore + (challengeFactor * 0.3), 1.0);
      }
      
      return weightedScore;
    } else if (scores.length === 2) {
      return scores[0] * 0.6 + scores[1] * 0.4;
    } else {
      return scores[0];
    }
  }
  
  return 0.1; // Default low score for new clients
}

/**
 * Analyze user agent string for bot indicators
 * @param {string} userAgent - User agent string
 * @returns {number} - Suspicious score between 0-1
 */
function analyzeUserAgent(userAgent) {
  if (!userAgent) {
    return 0.95; // Missing user agent is very suspicious
  }
  
  const userAgentLower = userAgent.toLowerCase();
  
  // Check for known bot keywords
  const botKeywords = [
    'bot', 'crawler', 'spider', 'scrape', 'http', 'java', 'python', 
    'go-http', 'headless', 'phantomjs', 'selenium', 'puppeteer', 
    'wget', 'curl', 'requests', 'axios'
  ];
  
  for (const keyword of botKeywords) {
    if (userAgentLower.includes(keyword)) {
      return 0.95;
    }
  }
  
  try {
    // Parse user agent for detailed analysis
    const parsedUA = parse(userAgent);
    
    // Check if it's identified as a bot
    if (parsedUA.device.type === 'bot') {
      return 0.95;
    }
    
    // Check for old or unusual browsers
    if (parsedUA.browser.name && parsedUA.browser.major) {
      const browserName = parsedUA.browser.name.toLowerCase();
      const majorVersion = parseInt(parsedUA.browser.major, 10);
      
      if (browserName === 'chrome' && majorVersion < 50) {
        return 0.8;
      } else if (browserName === 'firefox' && majorVersion < 45) {
        return 0.8;
      } else if (['ie', 'internet explorer'].includes(browserName)) {
        return 0.85; // IE is often used by scrapers
      }
    }
    
    // Check for suspicious or generic devices
    if (parsedUA.device.model) {
      const deviceModel = parsedUA.device.model.toLowerCase();
      if (deviceModel.includes('generic') || deviceModel.includes('unknown')) {
        return 0.7;
      }
    }
    
    return 0.1; // Normal user agent
    
  } catch (error) {
    logger.error(`Error parsing user agent: ${error.message}`);
    return 0.5; // Moderate score on parsing error
  }
}

/**
 * Analyze request patterns for suspicious behavior
 * @param {Object} profile - User profile
 * @returns {number} - Suspicious score
 */
function analyzeRequestPattern(profile) {
  // Look for sequential access patterns
  if (profile.pathsVisited.length >= 5) {
    const recentPaths = profile.pathsVisited.slice(-10);
    
    // Check for incremental numeric patterns
    // e.g., /products/1, /products/2, /products/3
    let sequentialCount = 0;
    
    for (let i = 1; i < recentPaths.length; i++) {
      const prevPath = recentPaths[i-1];
      const currentPath = recentPaths[i];
      
      // Extract numeric parts of paths
      const prevMatches = prevPath.match(/(\d+)/g);
      const currentMatches = currentPath.match(/(\d+)/g);
      
      if (prevMatches && currentMatches && prevMatches.length === currentMatches.length) {
        for (let j = 0; j < prevMatches.length; j++) {
          const prevNum = parseInt(prevMatches[j], 10);
          const currentNum = parseInt(currentMatches[j], 10);
          
          if (currentNum === prevNum + 1) {
            sequentialCount++;
            break;
          }
        }
      }
    }
    
    // If more than 50% of paths follow a sequential pattern
    if (sequentialCount > recentPaths.length * 0.5) {
      return 0.85;
    } else if (sequentialCount > recentPaths.length * 0.3) {
      return 0.6;
    }
  }
  
  return 0;
}

/**
 * Analyze referer header for consistency with navigation
 * @param {string} referer - Referer header
 * @param {Array} pathsVisited - Array of paths visited
 * @returns {number} - Suspicious score
 */
function analyzeReferer(referer, pathsVisited) {
  if (!referer || pathsVisited.length < 2) {
    return 0;
  }
  
  try {
    // Extract path from referer
    const refererUrl = new URL(referer);
    const refererPath = refererUrl.pathname;
    
    // Check if referer is consistent with recent navigation
    // In normal browsing, the referer should be a recently visited page
    const recentPaths = pathsVisited.slice(-5);
    
    if (!recentPaths.includes(refererPath)) {
      return 0.7; // Suspicious if referer is not from recent navigation
    }
  } catch (error) {
    // Invalid referer URL
    return 0.5;
  }
  
  return 0;
}

/**
 * Calculate ban duration based on profile
 * @param {Object} profile - User profile
 * @returns {number} - Ban duration in milliseconds
 */
function calculateBanDuration(profile) {
  // Base: 10 minutes (in ms)
  const baseDuration = 10 * 60 * 1000;
  
  if (profile.totalRequests > 1000) {
    // Persistent scraping: longer ban
    return baseDuration * 24; // 4 hours
  } else if (profile.totalRequests > 500) {
    return baseDuration * 6;  // 1 hour
  } else if (profile.totalRequests > 100) {
    return baseDuration * 3;  // 30 minutes
  }
  
  return baseDuration; // 10 minutes
}

/**
 * Determine appropriate challenge type based on profile
 * @param {Object} profile - User profile
 * @returns {string} - Challenge type: 'captcha', 'honeypot', or 'javascript'
 */
function determineChallenge(profile) {
  const suspiciousLevel = profile.suspiciousScore;
  
  if (suspiciousLevel > 0.85) {
    return 'captcha';
  } else if (suspiciousLevel > 0.8) {
    return 'honeypot';
  } else {
    return 'javascript';
  }
}

module.exports = {
  calculateSuspiciousScore,
  analyzeUserAgent,
  calculateBanDuration,
  determineChallenge
}; 