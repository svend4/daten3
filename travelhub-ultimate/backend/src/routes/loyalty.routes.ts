/**
 * Loyalty Program Routes
 */

import express from 'express';
import * as loyaltyController from '../controllers/loyalty.controller.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get member profile
router.get('/member', rateLimiters.moderate, loyaltyController.getMemberProfile);

// Get available rewards
router.get('/rewards', rateLimiters.moderate, loyaltyController.getRewards);

// Redeem points for reward
router.post('/redeem', rateLimiters.strict, loyaltyController.redeemReward);

// Get points history
router.get('/history', rateLimiters.moderate, loyaltyController.getPointsHistory);

export default router;
