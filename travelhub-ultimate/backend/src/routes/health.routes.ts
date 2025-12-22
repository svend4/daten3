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
  featureFlagMetrics,
  resetFeatureFlagMetricsEndpoint,
  apiKeyMetrics,
  resetApiKeyMetricsEndpoint,
  tieredRateLimitMetrics,
  resetTieredRateLimitMetricsEndpoint,
  batchingMetrics,
  resetBatchingMetricsEndpoint,
  websocketMetrics,
  fileUploadMetrics,
  resetFileUploadMetricsEndpoint,
  dataExportMetrics,
  resetDataExportMetricsEndpoint,
  webhookMetrics,
  resetWebhookMetricsEndpoint,
  messageQueueMetrics,
  resetMessageQueueMetricsEndpoint,
  backgroundJobsMetrics,
  resetBackgroundJobsMetricsEndpoint,
  advancedHealthCheckEndpoint,
  advancedHealthCheckMetrics,
  resetAdvancedHealthCheckMetricsEndpoint,
  deduplicationMetrics,
  resetDeduplicationMetricsEndpoint,
  clearDeduplicationCacheEndpoint,
  i18nMetrics,
  resetI18nMetricsEndpoint,
  tracingMetrics,
  resetTracingMetricsEndpoint,
  sseMetrics,
  resetSSEMetricsEndpoint,
  cdnMetrics,
  resetCDNMetricsEndpoint,
  cspMetrics,
  resetCSPMetricsEndpoint,
  cspViolationReport,
  multiTenancyMetrics,
  resetMultiTenancyMetricsEndpoint,
  clearTenantCacheEndpoint,
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
 * @route   GET /health/feature-flags
 * @desc    Feature flag statistics
 * @access  Public
 */
router.get('/feature-flags', featureFlagMetrics);

/**
 * @route   POST /health/feature-flags/reset
 * @desc    Reset feature flag statistics
 * @access  Admin only
 */
router.post('/feature-flags/reset', authenticate, requireAdmin, resetFeatureFlagMetricsEndpoint);

/**
 * @route   GET /health/api-keys
 * @desc    API key statistics
 * @access  Public
 */
router.get('/api-keys', apiKeyMetrics);

/**
 * @route   POST /health/api-keys/reset
 * @desc    Reset API key statistics
 * @access  Admin only
 */
router.post('/api-keys/reset', authenticate, requireAdmin, resetApiKeyMetricsEndpoint);

/**
 * @route   GET /health/tiered-rate-limit
 * @desc    Tiered rate limit statistics
 * @access  Public
 */
router.get('/tiered-rate-limit', tieredRateLimitMetrics);

/**
 * @route   POST /health/tiered-rate-limit/reset
 * @desc    Reset tiered rate limit statistics
 * @access  Admin only
 */
router.post('/tiered-rate-limit/reset', authenticate, requireAdmin, resetTieredRateLimitMetricsEndpoint);

/**
 * @route   GET /health/batching
 * @desc    Request batching statistics
 * @access  Public
 */
router.get('/batching', batchingMetrics);

/**
 * @route   POST /health/batching/reset
 * @desc    Reset batching statistics
 * @access  Admin only
 */
router.post('/batching/reset', authenticate, requireAdmin, resetBatchingMetricsEndpoint);

/**
 * @route   GET /health/websocket
 * @desc    WebSocket connection statistics
 * @access  Public
 */
router.get('/websocket', websocketMetrics);

/**
 * @route   GET /health/file-upload
 * @desc    File upload statistics
 * @access  Public
 */
router.get('/file-upload', fileUploadMetrics);

/**
 * @route   POST /health/file-upload/reset
 * @desc    Reset file upload statistics
 * @access  Admin only
 */
router.post('/file-upload/reset', authenticate, requireAdmin, resetFileUploadMetricsEndpoint);

/**
 * @route   GET /health/data-export
 * @desc    Data export statistics
 * @access  Public
 */
router.get('/data-export', dataExportMetrics);

/**
 * @route   POST /health/data-export/reset
 * @desc    Reset data export statistics
 * @access  Admin only
 */
router.post('/data-export/reset', authenticate, requireAdmin, resetDataExportMetricsEndpoint);

/**
 * @route   GET /health/webhooks
 * @desc    Webhook statistics
 * @access  Public
 */
router.get('/webhooks', webhookMetrics);

/**
 * @route   POST /health/webhooks/reset
 * @desc    Reset webhook statistics
 * @access  Admin only
 */
router.post('/webhooks/reset', authenticate, requireAdmin, resetWebhookMetricsEndpoint);

/**
 * @route   GET /health/message-queue
 * @desc    Message Queue statistics
 * @access  Public
 */
router.get('/message-queue', messageQueueMetrics);

/**
 * @route   POST /health/message-queue/reset
 * @desc    Reset message queue statistics
 * @access  Admin only
 */
router.post('/message-queue/reset', authenticate, requireAdmin, resetMessageQueueMetricsEndpoint);

/**
 * @route   GET /health/background-jobs
 * @desc    Background Jobs statistics
 * @access  Public
 */
router.get('/background-jobs', backgroundJobsMetrics);

/**
 * @route   POST /health/background-jobs/reset
 * @desc    Reset background jobs statistics
 * @access  Admin only
 */
router.post('/background-jobs/reset', authenticate, requireAdmin, resetBackgroundJobsMetricsEndpoint);

/**
 * @route   GET /health/advanced
 * @desc    Advanced health check with all dependencies
 * @access  Public
 */
router.get('/advanced', advancedHealthCheckEndpoint);

/**
 * @route   GET /health/advanced-health-check
 * @desc    Advanced health check statistics
 * @access  Public
 */
router.get('/advanced-health-check', advancedHealthCheckMetrics);

/**
 * @route   POST /health/advanced-health-check/reset
 * @desc    Reset advanced health check statistics
 * @access  Admin only
 */
router.post('/advanced-health-check/reset', authenticate, requireAdmin, resetAdvancedHealthCheckMetricsEndpoint);

/**
 * @route   GET /health/deduplication
 * @desc    Request deduplication statistics
 * @access  Public
 */
router.get('/deduplication', deduplicationMetrics);

/**
 * @route   POST /health/deduplication/reset
 * @desc    Reset deduplication statistics
 * @access  Admin only
 */
router.post('/deduplication/reset', authenticate, requireAdmin, resetDeduplicationMetricsEndpoint);

/**
 * @route   POST /health/deduplication/clear
 * @desc    Clear deduplication cache
 * @access  Admin only
 */
router.post('/deduplication/clear', authenticate, requireAdmin, clearDeduplicationCacheEndpoint);

/**
 * @route   GET /health/dashboard
 * @desc    Comprehensive metrics dashboard (all metrics in one response)
 * @access  Public
 */
router.get('/dashboard', metricsDashboard);

export default router;

/**
 * @route   GET /health/i18n
 * @desc    i18n statistics
 * @access  Public
 */
router.get('/i18n', i18nMetrics);

/**
 * @route   POST /health/i18n/reset
 * @desc    Reset i18n statistics
 * @access  Admin only
 */
router.post('/i18n/reset', authenticate, requireAdmin, resetI18nMetricsEndpoint);

/**
 * @route   GET /health/tracing
 * @desc    Distributed tracing statistics
 * @access  Public
 */
router.get('/tracing', tracingMetrics);

/**
 * @route   POST /health/tracing/reset
 * @desc    Reset tracing statistics
 * @access  Admin only
 */
router.post('/tracing/reset', authenticate, requireAdmin, resetTracingMetricsEndpoint);

/**
 * @route   GET /health/sse
 * @desc    SSE statistics
 * @access  Public
 */
router.get('/sse', sseMetrics);

/**
 * @route   POST /health/sse/reset
 * @desc    Reset SSE statistics
 * @access  Admin only
 */
router.post('/sse/reset', authenticate, requireAdmin, resetSSEMetricsEndpoint);

/**
 * @route   GET /health/cdn
 * @desc    CDN statistics
 * @access  Public
 */
router.get('/cdn', cdnMetrics);

/**
 * @route   POST /health/cdn/reset
 * @desc    Reset CDN statistics
 * @access  Admin only
 */
router.post('/cdn/reset', authenticate, requireAdmin, resetCDNMetricsEndpoint);

/**
 * @route   GET /health/csp
 * @desc    Content Security Policy statistics
 * @access  Public
 */
router.get('/csp', cspMetrics);

/**
 * @route   POST /health/csp/reset
 * @desc    Reset CSP statistics
 * @access  Admin only
 */
router.post('/csp/reset', authenticate, requireAdmin, resetCSPMetricsEndpoint);

/**
 * @route   POST /health/csp/report
 * @desc    CSP violation report endpoint
 * @access  Public (for browser reporting)
 */
router.post('/csp/report', cspViolationReport);

/**
 * @route   GET /health/tenancy
 * @desc    Multi-tenancy statistics
 * @access  Public
 */
router.get('/tenancy', multiTenancyMetrics);

/**
 * @route   POST /health/tenancy/reset
 * @desc    Reset multi-tenancy statistics
 * @access  Admin only
 */
router.post('/tenancy/reset', authenticate, requireAdmin, resetMultiTenancyMetricsEndpoint);

/**
 * @route   POST /health/tenancy/clear-cache
 * @desc    Clear tenant cache
 * @access  Admin only
 */
router.post('/tenancy/clear-cache', authenticate, requireAdmin, clearTenantCacheEndpoint);
