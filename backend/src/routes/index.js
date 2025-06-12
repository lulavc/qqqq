const express = require('express');
const router = express.Router();

// Import controllers
const contactController = require('../controllers/contactController');
const blogController = require('../controllers/blogController');
const authController = require('../controllers/authController');
const chatbotController = require('../controllers/chatbotController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// Auth routes
router.post('/auth/register', protect, authorize('admin'), authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getCurrentUser);
router.put('/auth/me', protect, authController.updateUser);

// Contact routes
router.post('/contact', contactController.submitContact);
router.get('/contact', protect, authorize('admin'), contactController.getContacts);
router.put('/contact/:id/status', protect, authorize('admin'), contactController.updateContactStatus);
router.delete('/contact/:id', protect, authorize('admin'), contactController.deleteContact);

// Blog routes
router.get('/blog', blogController.getPublishedPosts);
router.get('/blog/:slug', blogController.getPostBySlug);

// Admin blog routes
router.post('/admin/blog', protect, authorize('admin', 'editor'), blogController.createPost);
router.get('/admin/blog', protect, authorize('admin', 'editor'), blogController.getAllPosts);
router.put('/admin/blog/:id', protect, authorize('admin', 'editor'), blogController.updatePost);
router.delete('/admin/blog/:id', protect, authorize('admin'), blogController.deletePost);

// Chatbot routes
router.post('/chat', chatbotController.handleChatMessage);
router.get('/models', chatbotController.getModelInfo);

module.exports = router;