import express from 'express';
import { rateLimiters } from '../middleware/rateLimit.middleware';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// ===== PUBLIC ROUTES =====

// Registration & Login
router.post('/register', rateLimiters.moderate, authController.register);
router.post('/login', rateLimiters.moderate, authController.login);
router.post('/refresh', rateLimiters.lenient, authController.refreshToken);

// Password Management
router.post('/forgot-password', rateLimiters.strict, authController.forgotPassword);
router.post('/reset-password', rateLimiters.strict, authController.resetPassword);

// OAuth Routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

// ===== PROTECTED ROUTES =====

router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, authController.updateProfile);
router.put('/me/password', authenticate, authController.changePassword);
router.delete('/me', authenticate, authController.deleteAccount);

export default router;
