import express from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

/**
 * Review Routes
 * All routes require authentication except reading reviews
 */

// Public routes (no authentication required)
router.get('/:type/:entityId', rateLimiters.lenient, reviewController.getReviews);
router.get('/:type/:entityId/stats', rateLimiters.lenient, reviewController.getReviewStats);

// Protected routes (authentication required)
router.post('/', authenticate, rateLimiters.moderate, reviewController.createReview);
router.get('/my-reviews', authenticate, rateLimiters.lenient, reviewController.getMyReviews);
router.put('/:reviewId', authenticate, rateLimiters.moderate, reviewController.updateReview);
router.delete('/:reviewId', authenticate, rateLimiters.moderate, reviewController.deleteReview);
router.post('/:reviewId/helpful', rateLimiters.moderate, reviewController.markHelpful);

export default router;
