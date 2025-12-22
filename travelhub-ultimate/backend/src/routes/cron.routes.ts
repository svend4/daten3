/**
 * Cron Job Management Routes
 * Admin-only endpoints for cron job management
 */

import { Router } from 'express';
import {
  triggerCommissionApproval,
  getPendingCommissionsStats,
  getCronJobStatus,
  cleanupOldClicks,
  cleanupOldPriceAlerts,
} from '../controllers/cron.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// All cron routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/cron/status
 * @desc    Get cron job status and configuration
 * @access  Admin only
 */
router.get('/status', getCronJobStatus);

/**
 * @route   GET /api/admin/cron/pending-commissions
 * @desc    Get statistics about pending commissions
 * @access  Admin only
 */
router.get('/pending-commissions', getPendingCommissionsStats);

/**
 * @route   POST /api/admin/cron/approve-commissions
 * @desc    Manually trigger commission auto-approval
 * @access  Admin only
 */
router.post('/approve-commissions', triggerCommissionApproval);

/**
 * @route   POST /api/admin/cron/cleanup-clicks
 * @desc    Manually trigger affiliate click cleanup
 * @access  Admin only
 */
router.post('/cleanup-clicks', cleanupOldClicks);

/**
 * @route   POST /api/admin/cron/cleanup-price-alerts
 * @desc    Manually trigger price alert cleanup
 * @access  Admin only
 */
router.post('/cleanup-price-alerts', cleanupOldPriceAlerts);

export default router;
