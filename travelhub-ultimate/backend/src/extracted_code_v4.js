const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { rateLimiters } = require('../middleware/rateLimit.middleware');

// Public routes
router.post('/register', rateLimiters.moderate, authController.register);
router.post('/login', rateLimiters.moderate, authController.login);
router.post('/refresh', rateLimiters.lenient, authController.refreshToken);
router.post('/forgot-password', rateLimiters.strict, authController.forgotPassword);
router.post('/reset-password', rateLimiters.strict, authController.resetPassword);

// OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, authController.updateProfile);
router.put('/me/password', authenticate, authController.changePassword);
router.delete('/me', authenticate, authController.deleteAccount);

module.exports = router;
