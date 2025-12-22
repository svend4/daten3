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
  apiVersionMetrics,
  resetApiVersionMetricsEndpoint,
  sanitizationMetrics,
  resetSanitizationMetricsEndpoint,
  dbPerformanceMetrics,
  resetDbPerformanceMetricsEndpoint,
  timeoutMetrics,
  resetTimeoutMetricsEndpoint,
  circuitBreakerMetrics,
  resetCircuitBreakerMetricsEndpoint,
  cacheMetrics,
  resetCacheMetricsEndpoint,
  clearCacheEndpoint,
  auditMetrics,
  resetAuditMetricsEndpoint,
  replayProtectionMetrics,
  resetReplayProtectionMetricsEndpoint,
  clearIdempotencyKeysEndpoint,
  metricsDashboard,
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

/**
 * @route   GET /health/api-versions
 * @desc    API version usage statistics
 * @access  Public
 */
router.get('/api-versions', apiVersionMetrics);

/**
 * @route   POST /health/api-versions/reset
 * @desc    Reset API version tracking statistics
 * @access  Admin only
 */
router.post('/api-versions/reset', authenticate, requireAdmin, resetApiVersionMetricsEndpoint);

/**
 * @route   GET /health/sanitization
 * @desc    Input sanitization statistics
 * @access  Public
 */
router.get('/sanitization', sanitizationMetrics);

/**
 * @route   POST /health/sanitization/reset
 * @desc    Reset sanitization tracking statistics
 * @access  Admin only
 */
router.post('/sanitization/reset', authenticate, requireAdmin, resetSanitizationMetricsEndpoint);

/**
 * @route   GET /health/db-performance
 * @desc    Database query performance statistics
 * @access  Public
 */
router.get('/db-performance', dbPerformanceMetrics);

/**
 * @route   POST /health/db-performance/reset
 * @desc    Reset database performance tracking statistics
 * @access  Admin only
 */
router.post('/db-performance/reset', authenticate, requireAdmin, resetDbPerformanceMetricsEndpoint);

/**
 * @route   GET /health/timeouts
 * @desc    Request timeout statistics
 * @access  Public
 */
router.get('/timeouts', timeoutMetrics);

/**
 * @route   POST /health/timeouts/reset
 * @desc    Reset timeout tracking statistics
 * @access  Admin only
 */
router.post('/timeouts/reset', authenticate, requireAdmin, resetTimeoutMetricsEndpoint);

/**
 * @route   GET /health/circuit-breakers
 * @desc    Circuit breaker statistics
 * @access  Public
 */
router.get('/circuit-breakers', circuitBreakerMetrics);

/**
 * @route   POST /health/circuit-breakers/reset
 * @desc    Reset circuit breaker tracking statistics
 * @access  Admin only
 */
router.post('/circuit-breakers/reset', authenticate, requireAdmin, resetCircuitBreakerMetricsEndpoint);

/**
 * @route   GET /health/cache
 * @desc    Cache performance statistics
 * @access  Public
 */
router.get('/cache', cacheMetrics);

/**
 * @route   POST /health/cache/reset
 * @desc    Reset cache tracking statistics
 * @access  Admin only
 */
router.post('/cache/reset', authenticate, requireAdmin, resetCacheMetricsEndpoint);

/**
 * @route   POST /health/cache/clear
 * @desc    Clear all cached data
 * @access  Admin only
 */
router.post('/cache/clear', authenticate, requireAdmin, clearCacheEndpoint);

/**
 * @route   GET /health/audit
 * @desc    Audit logging statistics
 * @access  Public
 */
router.get('/audit', auditMetrics);

/**
 * @route   POST /health/audit/reset
 * @desc    Reset audit tracking statistics
 * @access  Admin only
 */
router.post('/audit/reset', authenticate, requireAdmin, resetAuditMetricsEndpoint);

/**
 * @route   GET /health/replay-protection
 * @desc    Replay protection statistics
 * @access  Public
 */
router.get('/replay-protection', replayProtectionMetrics);

/**
 * @route   POST /health/replay-protection/reset
 * @desc    Reset replay protection tracking statistics
 * @access  Admin only
 */
router.post('/replay-protection/reset', authenticate, requireAdmin, resetReplayProtectionMetricsEndpoint);

/**
 * @route   POST /health/replay-protection/clear
 * @desc    Clear all idempotency keys
 * @access  Admin only
 */
router.post('/replay-protection/clear', authenticate, requireAdmin, clearIdempotencyKeysEndpoint);

/**
 * @route   GET /health/dashboard
 * @desc    Comprehensive metrics dashboard (all metrics in one response)
 * @access  Public
 */
router.get('/dashboard', metricsDashboard);

export default router;
