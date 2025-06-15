const express = require('express');
const router = express.Router();
const { AISecurityMiddleware, aiSchemas } = require('../middleware/aiSecurityMiddleware');
const logger = require('../utils/logger');
const SecurityOverview = require('../middleware/securityOverview');
const aiController = require('../controllers/aiController');
const aiSecurityMiddleware = require('../middleware/aiSecurityMiddleware');
const securityMiddleware = require('../middleware/securityMiddleware');
const secureMongoClient = require('../lib/mongodb/secureClient');

/**
 * Routes for AI API with implemented security measures
 * Implements protection against irregular use by unauthorized users
 */

// Security middleware for all AI routes (using the instance directly)
// router.use(aiSecurityMiddleware.aiRateLimiter()); // This seems to be a custom method not defined in the provided aiSecurityMiddleware
// router.use(aiSecurityMiddleware.logAIUsage()); // This also seems to be a custom method

// Middleware for all AI routes: rate limit and log usage
router.use(aiSecurityMiddleware.rateLimit()); // Using the general rateLimit from the instance
router.use(aiSecurityMiddleware.logUsage());   // Using the general logUsage from the instance

// Route to generate a temporary token for AI API (requires authenticated user)
router.post('/token/generate', securityMiddleware.protectRoute(), async (req, res) => { // Assuming protectRoute is the correct auth middleware
  try {
    // Generate token with specific scopes and expiry
    const token = aiSecurityMiddleware.generateToken(req.user.id, ['text', 'embedding'], '2h');
    res.status(200).json({ status: 'success', token, expiresIn: '2h' });
  } catch (error) {
    logger.error('Error generating API token', error);
    res.status(500).json({ status: 'error', code: 'TOKEN_GENERATION_ERROR', message: 'Failed to generate token' });
  }
});

// Routes to manage API keys
router.route('/keys')
  // List API keys (requires authentication)
  .get(securityMiddleware.protectRoute(), async (req, res) => {
    try {
      const apiKeys = await secureMongoClient.find('apiKeys', {
        userId: req.user.id, // Filter by current user
        active: true         // Only active keys
      }, {
        projection: { key: 0 } // Do not return the full key for listing
      });

      res.status(200).json({
        status: 'success',
        data: apiKeys.map(key => ({
          id: key._id,
          name: key.name,
          scopes: key.scopes,
          plan: key.plan,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed,
          expiresAt: key.expiresAt,
          // Show only the first characters of the key for preview
          keyPreview: key.key ? `${key.key.substring(0, aiSecurityMiddleware.API_KEY_PREFIX.length + 5)}...` : null
        }))
      });
    } catch (error) {
      logger.error('Error listing API keys', error);
      res.status(500).json({ status: 'error', code: 'LISTING_ERROR', message: 'Failed to list keys' });
    }
  })
  // Create new API key (requires authentication)
  .post(
    securityMiddleware.protectRoute(),
    aiSecurityMiddleware.validateInput(aiSecurityMiddleware.schemas.createApiKey), // Validate input against schema
    async (req, res) => {
      try {
        const { name, scopes, allowedOrigins, expiresAt, plan } = req.validatedBody; // Use validated data

        // Check if the user has permission for the requested plan (example logic)
        if (plan === 'premium' && req.user.role !== 'admin' && req.user.role !== 'premium_user') {
          return res.status(403).json({
            status: 'error',
            code: 'PLAN_NOT_AUTHORIZED',
            message: 'You do not have permission to create keys with this plan'
          });
        }

        // Generate new key
        const apiKeyData = aiSecurityMiddleware.generateApiKey({
          userId: req.user.id,
          name,
          scopes: scopes || ['text', 'embedding'], // Default scopes if not provided
          allowedOrigins,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          plan: plan || 'standard' // Default plan if not provided
        });

        // Save to database
        const result = await secureMongoClient.insert('apiKeys', apiKeyData);

        logger.info('New API key created', {
          userId: req.user.id,
          keyId: result.insertedId,
          scopes: apiKeyData.scopes,
          plan: apiKeyData.plan
        });

        res.status(201).json({
          status: 'success',
          message: 'API key created successfully',
          data: {
            key: apiKeyData.key, // Return the full key only upon creation
            id: result.insertedId,
            name: apiKeyData.name,
            scopes: apiKeyData.scopes,
            plan: apiKeyData.plan,
            expiresAt: apiKeyData.expiresAt
          }
        });
      } catch (error) {
        logger.error('Error creating API key', error);
        res.status(500).json({ status: 'error', code: 'CREATION_ERROR', message: 'Failed to create key' });
      }
    }
  );

// Revoke an API key
router.delete('/keys/:keyId', securityMiddleware.protectRoute(), async (req, res) => {
  try {
    const { keyId } = req.params;

    // Verify that the key belongs to the user
    const apiKey = await secureMongoClient.findOne('apiKeys', {
      _id: keyId, // Ensure keyId is a valid ObjectId if using MongoDB's default
      userId: req.user.id
    });

    if (!apiKey) {
      return res.status(404).json({
        status: 'error',
        code: 'KEY_NOT_FOUND',
        message: 'API key not found or does not belong to this user'
      });
    }

    // Revoke the key (deactivate)
    await secureMongoClient.updateOne('apiKeys',
      { _id: keyId },
      { $set: { active: false, revokedAt: new Date() } }
    );

    logger.info('API key revoked', { keyId, userId: req.user.id });

    res.status(200).json({
      status: 'success',
      message: 'API key revoked successfully'
    });
  } catch (error) {
    logger.error('Error revoking API key', error);
    res.status(500).json({ status: 'error', code: 'REVOCATION_ERROR', message: 'Failed to revoke key' });
  }
});

// Route for text generation (protected by API key or token)
router.post('/text/generate',
  // Check API key OR token
  (req, res, next) => {
    // If API key header exists, validate API key
    if (req.headers['x-api-key']) {
      return aiSecurityMiddleware.validateApiKey(['text'])(req, res, next);
    }
    // Otherwise, validate JWT token
    return aiSecurityMiddleware.validateToken()(req, res, next);
  },
  // Check scope
  aiSecurityMiddleware.authorizeScope(['text']),
  // Validate input
  aiSecurityMiddleware.validateInput(aiSecurityMiddleware.schemas.textGeneration),
  // Controller
  aiController.generateText
);

// Route for image generation (protected by API key or token)
router.post('/image/generate',
  // Check API key OR token
  (req, res, next) => {
    if (req.headers['x-api-key']) {
      return aiSecurityMiddleware.validateApiKey(['image'])(req, res, next);
    }
    return aiSecurityMiddleware.validateToken()(req, res, next);
  },
  // Check scope
  aiSecurityMiddleware.authorizeScope(['image']),
  // Validate input
  aiSecurityMiddleware.validateInput(aiSecurityMiddleware.schemas.imageGeneration),
  // Controller
  aiController.generateImage
);

// Route for embedding generation (protected by API key or token)
router.post('/embeddings',
  // Check API key OR token
  (req, res, next) => {
    if (req.headers['x-api-key']) {
      return aiSecurityMiddleware.validateApiKey(['embedding'])(req, res, next);
    }
    return aiSecurityMiddleware.validateToken()(req, res, next);
  },
  // Check scope
  aiSecurityMiddleware.authorizeScope(['embedding']),
  // Validate input
  aiSecurityMiddleware.validateInput(aiSecurityMiddleware.schemas.embedding),
  // Controller
  aiController.generateEmbedding
);

// Route to check API status
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AI API operational'
  });
});

// Route for public API documentation
router.get('/docs', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      name: 'AInovar Tech AI API',
      version: '1.0.0',
      description: 'API for accessing AInovar\'s Artificial Intelligence models and services.',
      authentication: 'Requires a valid API key or a temporary JWT token. See /api/ai/token/generate.',
      documentationUrl: 'https://docs.ainovar.tech/api/ai' , // Example URL
      endpoints: [
        {
          path: '/api/ai/status',
          method: 'GET',
          description: 'Checks the operational status of the API.',
          authentication: 'None'
        },
        {
          path: '/api/ai/token/generate',
          method: 'POST',
          description: 'Generates a temporary JWT token for API usage.',
          authentication: 'User session (e.g., logged-in user)'
        },
        {
          path: '/api/ai/keys',
          method: 'GET',
          description: 'Lists active API keys for the authenticated user.',
          authentication: 'User session'
        },
        {
          path: '/api/ai/keys',
          method: 'POST',
          description: 'Creates a new API key for the authenticated user.',
          authentication: 'User session',
          bodyParams: {
            name: 'string (required) - Descriptive name for the key.',
            scopes: 'array (optional) - Scopes like ["text", "image"]. Default: ["text", "embedding"].',
            allowedOrigins: 'array (optional) - Domains allowed to use this key.',
            expiresAt: 'string (optional) - ISO 8601 datetime for key expiration.',
            plan: 'string (optional) - "standard" or "premium". Requires permission for "premium".'
          }
        },
        {
          path: '/api/ai/keys/:keyId',
          method: 'DELETE',
          description: 'Revokes (deactivates) an API key.',
          authentication: 'User session'
        },
        {
          path: '/api/ai/text/generate',
          method: 'POST',
          description: 'Generates text based on a prompt.',
          authentication: 'API key or JWT token',
          documentation: 'Requires "text" scope. See schema in aiSecurityMiddleware.schemas.textGeneration.'
        },
        {
          path: '/api/ai/image/generate',
          method: 'POST',
          description: 'Generates an image based on a prompt.',
          authentication: 'API key or JWT token',
          documentation: 'Requires "image" scope. See schema in aiSecurityMiddleware.schemas.imageGeneration.'
        },
        {
          path: '/api/ai/embeddings',
          method: 'POST',
          description: 'Generates embeddings for a given text.',
          authentication: 'API key or JWT token',
          documentation: 'Requires "embedding" scope. See schema in aiSecurityMiddleware.schemas.embedding.'
        }
      ]
    }
  });
});

module.exports = router;
