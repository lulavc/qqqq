const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const antiScraping = require('../middleware/antiScraping');
const config = require('../config/antiScrapingConfig');
const logger = require('../utils/logger');

// Redis client is already available in antiScraping middleware

/**
 * Generate a JavaScript challenge (simple math problem)
 */
router.get('/javascript', (req, res) => {
  // Create math challenge
  const a = Math.floor(Math.random() * 100) + 1;
  const b = Math.floor(Math.random() * 100) + 1;
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let result;
  if (operation === '+') {
    result = a + b;
  } else if (operation === '-') {
    result = a - b;
  } else {
    result = a * b;
  }
  
  // Generate challenge ID
  const challengeId = crypto
    .createHash('sha256')
    .update(`${a}${operation}${b}${result}${Date.now()}`)
    .digest('hex')
    .substring(0, 16);
  
  // Store challenge in Redis for verification
  // Key format: challenge:js:{id}, expiry: 5 minutes
  const redis = require('ioredis').getClient();
  redis.setex(`challenge:js:${challengeId}`, 300, result.toString());
  
  // Return challenge to client
  res.json({
    type: 'javascript',
    id: challengeId,
    challenge: `${a} ${operation} ${b}`,
    // Don't include expected result in response!
  });
});

/**
 * Generate a honeypot challenge
 */
router.get('/honeypot', (req, res) => {
  // Generate random field name
  const fieldIndex = Math.floor(Math.random() * config.HONEYPOT.FIELD_NAMES.length);
  const fieldName = config.HONEYPOT.FIELD_NAMES[fieldIndex];
  
  // Create unique challenge ID
  const challengeId = crypto
    .createHash('sha256')
    .update(`${fieldName}${Date.now()}`)
    .digest('hex')
    .substring(0, 16);
  
  // Store honeypot configuration (only ID needed for verification)
  const redis = require('ioredis').getClient();
  redis.setex(`challenge:hp:${challengeId}`, 300, fieldName);
  
  res.json({
    type: 'honeypot',
    id: challengeId,
    fieldName: fieldName,
  });
});

/**
 * Generate a text CAPTCHA
 * In production, you would use a service like reCAPTCHA
 */
router.get('/captcha', (req, res) => {
  // Generate random CAPTCHA text
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let captchaText = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    captchaText += chars[randomIndex];
  }
  
  // Create challenge ID
  const challengeId = crypto
    .createHash('sha256')
    .update(`${captchaText}${Date.now()}`)
    .digest('hex')
    .substring(0, 16);
  
  // Store in Redis for verification
  const redis = require('ioredis').getClient();
  redis.setex(`challenge:cap:${challengeId}`, 300, captchaText);
  
  res.json({
    type: 'captcha',
    id: challengeId,
    // In a real implementation, you'd generate an image here
    // For simplicity, we're just sending text
    challenge: captchaText,
  });
});

/**
 * Verify challenge response
 */
router.post('/verify', async (req, res) => {
  const { id, type, response } = req.body;
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  if (!id || !type || response === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request parameters'
    });
  }
  
  try {
    const redis = require('ioredis').getClient();
    let success = false;
    
    // Verify based on challenge type
    if (type === 'javascript') {
      const expectedResult = await redis.get(`challenge:js:${id}`);
      if (expectedResult && response.toString() === expectedResult) {
        success = true;
      }
    } 
    else if (type === 'honeypot') {
      // For honeypot, success means the field was LEFT EMPTY
      const fieldName = await redis.get(`challenge:hp:${id}`);
      if (fieldName && (response === '' || response === null || response === undefined)) {
        success = true;
      }
    } 
    else if (type === 'captcha') {
      const expectedText = await redis.get(`challenge:cap:${id}`);
      if (expectedText && response.toUpperCase() === expectedText) {
        success = true;
      }
    }
    
    // Record result in client profile
    await antiScraping.recordChallengeResult(clientIp, success);
    
    // Clear challenge from Redis
    if (type === 'javascript') {
      redis.del(`challenge:js:${id}`);
    } else if (type === 'honeypot') {
      redis.del(`challenge:hp:${id}`);
    } else if (type === 'captcha') {
      redis.del(`challenge:cap:${id}`);
    }
    
    if (success) {
      res.json({
        success: true,
        message: 'Challenge passed successfully'
      });
    } else {
      res.status(403).json({
        success: false,
        message: 'Challenge failed'
      });
    }
    
  } catch (error) {
    logger.error(`Challenge verification error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error verifying challenge'
    });
  }
});

/**
 * Record mouse movements from client
 */
router.post('/activity', async (req, res) => {
  const { movements } = req.body;
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  if (!movements || typeof movements !== 'number') {
    return res.status(400).json({ success: false });
  }
  
  try {
    // Record mouse movements
    await antiScraping.updateMouseMovements(clientIp, movements);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Error recording activity: ${error.message}`);
    res.status(500).json({ success: false });
  }
});

module.exports = router; 