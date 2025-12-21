import express from 'express';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { endpointRateLimiters } from '../middleware/perUserRateLimit.middleware.js';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  changePasswordValidator,
} from '../validators/auth.validators.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====

// Registration & Login
router.post(
  '/register',
  endpointRateLimiters.register,
  registerValidator,
  validate,
  authController.register
);

router.post(
  '/login',
  endpointRateLimiters.login,
  loginValidator,
  validate,
  authController.login
);

router.post(
  '/refresh',
  rateLimiters.lenient,
  refreshTokenValidator,
  validate,
  authController.refreshToken
);

// Password Management
router.post(
  '/forgot-password',
  endpointRateLimiters.passwordReset,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  endpointRateLimiters.passwordReset,
  resetPasswordValidator,
  validate,
  authController.resetPassword
);

// OAuth Routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

// Email Verification
router.post(
  '/send-verification-email',
  endpointRateLimiters.emailVerification,
  authController.sendVerificationEmail
);

router.get(
  '/verify-email',
  endpointRateLimiters.emailVerification,
  authController.verifyEmail
);

// ===== PROTECTED ROUTES =====

router.get('/me', authenticate, authController.getCurrentUser);

router.put(
  '/me',
  authenticate,
  updateProfileValidator,
  validate,
  authController.updateProfile
);

router.put(
  '/me/password',
  authenticate,
  changePasswordValidator,
  validate,
  authController.changePassword
);

router.delete('/me', authenticate, authController.deleteAccount);

export default router;
