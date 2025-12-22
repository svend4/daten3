import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

/**
 * Report Routes
 * All routes require authentication
 * Admin routes require admin role
 */

// Summary report (available to all authenticated users)
router.get('/summary', authenticate, rateLimiters.moderate, reportController.getSummaryReport);

// My affiliate report (for affiliates)
router.get('/my-affiliate', authenticate, rateLimiters.moderate, reportController.getMyAffiliateReport);

// Admin-only reports
router.get('/revenue', authenticate, requireAdmin, rateLimiters.moderate, reportController.getRevenueReport);
router.get('/users', authenticate, requireAdmin, rateLimiters.moderate, reportController.getUserReport);
router.get('/affiliate/:affiliateId', authenticate, rateLimiters.moderate, reportController.getAffiliateReport);

export default router;
