/**
 * Metrics Routes
 * Endpoints for Prometheus metrics
 */

import { Router } from 'express';
import {
  getMetrics,
  getMetricsSummary,
  resetMetrics,
} from '../controllers/metrics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

/**
 * @route   GET /metrics
 * @desc    Get Prometheus metrics
 * @access  Public (restrict in production)
 */
router.get('/', getMetrics);

/**
 * @route   GET /metrics/summary
 * @desc    Get metrics summary (JSON)
 * @access  Admin
 */
router.get('/summary', authenticate, requireAdmin, getMetricsSummary);

/**
 * @route   POST /metrics/reset
 * @desc    Reset all metrics
 * @access  Admin
 */
router.post('/reset', authenticate, requireAdmin, resetMetrics);

export default router;
