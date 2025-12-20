import express from 'express';
import { rateLimiters } from '../middleware/rateLimit.middleware';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  changePasswordValidator,
} from '../validators/auth.validators';

const router = express.Router();

// ===== PUBLIC ROUTES =====

// Registration & Login
router.post(
  '/register',
  rateLimiters.moderate,
  registerValidator,
  validate,
  authController.register
);

router.post(
  '/login',
  rateLimiters.moderate,
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
  rateLimiters.strict,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  rateLimiters.strict,
  resetPasswordValidator,
  validate,
  authController.resetPassword
);

// OAuth Routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

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
