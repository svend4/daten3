import { Router } from 'express';
import {
  basicHealthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
  performanceMetrics,
  errorMetrics,
  resetErrorMetricsEndpoint,
  responseTimeMetrics,
  resetResponseTimeMetricsEndpoint,
} from '../controllers/health.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /health
 * @desc    Basic health check - fast response
 * @access  Public
 */
router.get('/', basicHealthCheck);

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with dependency status
 * @access  Public
 */
router.get('/detailed', detailedHealthCheck);

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for orchestrators (K8s, Railway)
 * @access  Public
 */
router.get('/ready', readinessCheck);

/**
 * @route   GET /health/live
 * @desc    Liveness probe for orchestrators (K8s, Railway)
 * @access  Public
 */
router.get('/live', livenessCheck);

/**
 * @route   GET /health/metrics
 * @desc    Performance metrics
 * @access  Public
 */
router.get('/metrics', performanceMetrics);

/**
 * @route   GET /health/errors
 * @desc    Error tracking metrics
 * @access  Public
 */
router.get('/errors', errorMetrics);

/**
 * @route   POST /health/errors/reset
 * @desc    Reset error tracking metrics
 * @access  Admin only
 */
router.post('/errors/reset', authenticate, requireAdmin, resetErrorMetricsEndpoint);

/**
 * @route   GET /health/response-times
 * @desc    Response time distribution and statistics
 * @access  Public
 */
router.get('/response-times', responseTimeMetrics);

/**
 * @route   POST /health/response-times/reset
 * @desc    Reset response time tracking statistics
 * @access  Admin only
 */
router.post('/response-times/reset', authenticate, requireAdmin, resetResponseTimeMetricsEndpoint);

export default router;
