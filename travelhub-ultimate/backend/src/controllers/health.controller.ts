import { Request, Response } from 'express';
import { redisService } from '../services/redis.service.js';
import { prisma } from '../lib/prisma.js';
import logger from '../utils/logger.js';
import { getPerformanceMetrics } from '../middleware/logger.middleware.js';
import { getErrorMetrics, resetErrorMetrics } from '../middleware/errorHandler.middleware.js';
import { getResponseTimeStats, resetResponseTimeStats } from '../middleware/responseTime.middleware.js';
import { getVersionStats, resetVersionStats } from '../middleware/apiVersion.middleware.js';
import { getSanitizationStats, resetSanitizationStats } from '../middleware/sanitization.middleware.js';
import { getDbPerformanceStats, resetDbPerformanceStats } from '../middleware/dbPerformance.middleware.js';
import { getTimeoutStats, resetTimeoutStats } from '../middleware/timeout.middleware.js';
import { getCircuitBreakerStats, resetCircuitBreakerStats } from '../middleware/circuitBreaker.middleware.js';
import { getCacheStats, resetCacheStats, clearAllCaches } from '../middleware/advancedCache.middleware.js';
import { getAuditStats, resetAuditStats } from '../middleware/auditLog.middleware.js';
import { getReplayProtectionStats, resetReplayProtectionStats, clearAllIdempotencyKeys } from '../middleware/replayProtection.middleware.js';
import { getFeatureFlagStats, resetFeatureFlagStats } from '../middleware/featureFlags.middleware.js';
import { getApiKeyStats, resetApiKeyStats } from '../middleware/apiKey.middleware.js';
import { getTieredRateLimitStats, resetTieredRateLimitStats } from '../middleware/tieredRateLimit.middleware.js';
import { getBatchStats, resetBatchStats } from '../middleware/requestBatching.middleware.js';
import { getWebSocketStats } from '../services/websocket.service.js';
import { getFileUploadStats, resetFileUploadStats } from '../middleware/fileUpload.middleware.js';
import { getDataExportStats, resetDataExportStats } from '../services/dataExport.service.js';
import { getWebhookStats, resetWebhookStats } from '../services/webhook.service.js';

interface ServiceStatus {
  status: string;
  responseTime: number;
  error?: string;
}

/**
 * Basic health check endpoint
 * Returns server status and uptime
 */
export const basicHealthCheck = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
};

/**
 * Detailed health check endpoint
 * Checks all critical dependencies (Database, Redis, External APIs)
 */
export const detailedHealthCheck = async (req: Request, res: Response) => {
  const healthStatus: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: { status: 'unknown', responseTime: 0 } as ServiceStatus,
      redis: { status: 'unknown', responseTime: 0 } as ServiceStatus,
      travelpayoutsAPI: { status: 'unknown', responseTime: 0 } as ServiceStatus,
    },
    system: {
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
        unit: 'MB',
      },
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
    },
  };

  let hasErrors = false;
  let hasDegradation = false;

  // Check Database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - dbStart;
    healthStatus.services.database = {
      status: responseTime > 1000 ? 'slow' : 'healthy',
      responseTime,
    };
    if (responseTime > 1000) hasDegradation = true;
  } catch (error: any) {
    logger.error('Health check - Database error:', error);
    healthStatus.services.database = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message,
    };
    hasErrors = true;
  }

  // Check Redis connection
  try {
    const redisStart = Date.now();
    await redisService.ping();
    const responseTime = Date.now() - redisStart;
    healthStatus.services.redis = {
      status: responseTime > 500 ? 'slow' : 'healthy',
      responseTime,
    };
    if (responseTime > 500) hasDegradation = true;
  } catch (error: any) {
    logger.error('Health check - Redis error:', error);
    healthStatus.services.redis = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message,
    };
    // Redis is not critical, so degraded instead of error
    hasDegradation = true;
  }

  // Check Travelpayouts API (external API health)
  try {
    const apiStart = Date.now();
    // Simple ping to Travelpayouts API endpoints
    const response = await fetch('https://api.travelpayouts.com/v1/flight_search_results?', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    const responseTime = Date.now() - apiStart;
    healthStatus.services.travelpayoutsAPI = {
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      statusCode: response.status,
    };
    if (!response.ok) hasDegradation = true;
  } catch (error: any) {
    logger.warn('Health check - Travelpayouts API error:', error.message);
    healthStatus.services.travelpayoutsAPI = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message,
    };
    // External API is not critical for our health
    hasDegradation = true;
  }

  // Set overall status
  healthStatus.status = hasErrors ? 'unhealthy' : hasDegradation ? 'degraded' : 'healthy';

  // Return appropriate status code
  const statusCode = hasErrors ? 503 : hasDegradation ? 200 : 200;
  res.status(statusCode).json(healthStatus);
};

/**
 * Readiness probe for Kubernetes/Railway
 * Returns 200 if app is ready to serve traffic
 */
export const readinessCheck = async (req: Request, res: Response) => {
  try {
    // Check critical services
    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      redisService.ping()
    ]);

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * Liveness probe for Kubernetes/Railway
 * Returns 200 if app is alive (even if dependencies are down)
 */
export const livenessCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

/**
 * Performance metrics endpoint
 * GET /api/health/metrics
 */
export const performanceMetrics = (req: Request, res: Response) => {
  try {
    const metrics = getPerformanceMetrics();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error: any) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics',
    });
  }
};

/**
 * Error metrics endpoint
 * GET /api/health/errors
 * Returns comprehensive error tracking metrics
 */
export const errorMetrics = (req: Request, res: Response) => {
  try {
    const metrics = getErrorMetrics();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error: any) {
    logger.error('Error getting error metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve error metrics',
    });
  }
};

/**
 * Reset error metrics endpoint
 * POST /api/health/errors/reset
 * Admin only - resets error tracking metrics
 */
export const resetErrorMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetErrorMetrics();

    logger.info('Error metrics reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Error metrics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting error metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset error metrics',
    });
  }
};

/**
 * Response time statistics endpoint
 * GET /api/health/response-times
 * Returns detailed response time distribution and statistics
 */
export const responseTimeMetrics = (req: Request, res: Response) => {
  try {
    const stats = getResponseTimeStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting response time stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve response time statistics',
    });
  }
};

/**
 * Reset response time statistics endpoint
 * POST /api/health/response-times/reset
 * Admin only - resets response time tracking
 */
export const resetResponseTimeMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetResponseTimeStats();

    logger.info('Response time stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Response time statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting response time stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset response time statistics',
    });
  }
};

/**
 * API versioning statistics endpoint
 * GET /api/health/api-versions
 * Returns API version usage statistics
 */
export const apiVersionMetrics = (req: Request, res: Response) => {
  try {
    const stats = getVersionStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting API version stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API version statistics',
    });
  }
};

/**
 * Reset API version statistics endpoint
 * POST /api/health/api-versions/reset
 * Admin only - resets API version tracking
 */
export const resetApiVersionMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetVersionStats();

    logger.info('API version stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'API version statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting API version stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset API version statistics',
    });
  }
};

/**
 * Sanitization statistics endpoint
 * GET /api/health/sanitization
 * Returns input sanitization statistics
 */
export const sanitizationMetrics = (req: Request, res: Response) => {
  try {
    const stats = getSanitizationStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting sanitization stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sanitization statistics',
    });
  }
};

/**
 * Reset sanitization statistics endpoint
 * POST /api/health/sanitization/reset
 * Admin only - resets sanitization tracking
 */
export const resetSanitizationMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetSanitizationStats();

    logger.info('Sanitization stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Sanitization statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting sanitization stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset sanitization statistics',
    });
  }
};

/**
 * Database performance metrics endpoint
 * GET /api/health/db-performance
 * Returns database query performance statistics
 */
export const dbPerformanceMetrics = (req: Request, res: Response) => {
  try {
    const stats = getDbPerformanceStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting database performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve database performance statistics',
    });
  }
};

/**
 * Reset database performance statistics endpoint
 * POST /api/health/db-performance/reset
 * Admin only - resets database performance tracking
 */
export const resetDbPerformanceMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetDbPerformanceStats();

    logger.info('Database performance stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Database performance statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting database performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset database performance statistics',
    });
  }
};

/**
 * Request timeout statistics endpoint
 * GET /api/health/timeouts
 * Returns request timeout statistics
 */
export const timeoutMetrics = (req: Request, res: Response) => {
  try {
    const stats = getTimeoutStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting timeout stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve timeout statistics',
    });
  }
};

/**
 * Reset timeout statistics endpoint
 * POST /api/health/timeouts/reset
 * Admin only - resets timeout tracking
 */
export const resetTimeoutMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetTimeoutStats();

    logger.info('Timeout stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Timeout statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting timeout stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset timeout statistics',
    });
  }
};

/**
 * Comprehensive metrics dashboard endpoint
 * GET /api/health/dashboard
 * Returns all metrics in one response
 */
export const metricsDashboard = (req: Request, res: Response) => {
  try {
    const dashboard = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      metrics: {
        performance: getPerformanceMetrics(),
        errors: getErrorMetrics(),
        responseTimes: getResponseTimeStats(),
        apiVersions: getVersionStats(),
        sanitization: getSanitizationStats(),
        dbPerformance: getDbPerformanceStats(),
        timeouts: getTimeoutStats(),
        circuitBreakers: getCircuitBreakerStats(),
        cache: getCacheStats(),
        audit: getAuditStats(),
        replayProtection: getReplayProtectionStats(),
        featureFlags: getFeatureFlagStats(),
        apiKeys: getApiKeyStats(),
        tieredRateLimit: getTieredRateLimitStats(),
        batching: getBatchStats(),
        websocket: getWebSocketStats(),
        fileUpload: getFileUploadStats(),
        dataExport: getDataExportStats(),
        webhooks: getWebhookStats(),
      },
      system: {
        memory: {
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
          unit: 'MB',
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    res.status(200).json({
      success: true,
      dashboard,
    });
  } catch (error: any) {
    logger.error('Error getting metrics dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics dashboard',
    });
  }
};

/**
 * Circuit breaker statistics endpoint
 * GET /api/health/circuit-breakers
 * Returns circuit breaker statistics
 */
export const circuitBreakerMetrics = (req: Request, res: Response) => {
  try {
    const stats = getCircuitBreakerStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting circuit breaker stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve circuit breaker statistics',
    });
  }
};

/**
 * Reset circuit breaker statistics endpoint
 * POST /api/health/circuit-breakers/reset
 * Admin only - resets circuit breaker tracking
 */
export const resetCircuitBreakerMetricsEndpoint = (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    resetCircuitBreakerStats(name);

    logger.info('Circuit breaker stats reset', {
      adminId: (req as any).user?.id,
      breakerName: name || 'all',
    });

    res.status(200).json({
      success: true,
      message: name
        ? `Circuit breaker "${name}" has been reset`
        : 'All circuit breakers have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting circuit breaker stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset circuit breaker statistics',
    });
  }
};

/**
 * Cache statistics endpoint
 * GET /api/health/cache
 * Returns cache performance statistics
 */
export const cacheMetrics = (req: Request, res: Response) => {
  try {
    const stats = getCacheStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics',
    });
  }
};

/**
 * Reset cache statistics endpoint
 * POST /api/health/cache/reset
 * Admin only - resets cache tracking
 */
export const resetCacheMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetCacheStats();

    logger.info('Cache stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Cache statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset cache statistics',
    });
  }
};

/**
 * Clear all caches endpoint
 * POST /api/health/cache/clear
 * Admin only - clears all cached data
 */
export const clearCacheEndpoint = async (req: Request, res: Response) => {
  try {
    await clearAllCaches();

    logger.info('All caches cleared', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'All caches have been cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error clearing caches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear caches',
    });
  }
};

/**
 * Audit log statistics endpoint
 * GET /api/health/audit
 * Returns audit logging statistics
 */
export const auditMetrics = (req: Request, res: Response) => {
  try {
    const stats = getAuditStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting audit stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit statistics',
    });
  }
};

/**
 * Reset audit statistics endpoint
 * POST /api/health/audit/reset
 * Admin only - resets audit tracking
 */
export const resetAuditMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetAuditStats();

    logger.info('Audit stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Audit statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting audit stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset audit statistics',
    });
  }
};

/**
 * Replay protection statistics endpoint
 * GET /api/health/replay-protection
 * Returns replay protection statistics
 */
export const replayProtectionMetrics = (req: Request, res: Response) => {
  try {
    const stats = getReplayProtectionStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting replay protection stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve replay protection statistics',
    });
  }
};

/**
 * Reset replay protection statistics endpoint
 * POST /api/health/replay-protection/reset
 * Admin only - resets replay protection tracking
 */
export const resetReplayProtectionMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetReplayProtectionStats();

    logger.info('Replay protection stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Replay protection statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting replay protection stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset replay protection statistics',
    });
  }
};

/**
 * Clear all idempotency keys endpoint
 * POST /api/health/replay-protection/clear
 * Admin only - clears all idempotency keys
 */
export const clearIdempotencyKeysEndpoint = async (req: Request, res: Response) => {
  try {
    await clearAllIdempotencyKeys();

    logger.info('All idempotency keys cleared', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'All idempotency keys have been cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error clearing idempotency keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear idempotency keys',
    });
  }
};

/**
 * Feature flags statistics endpoint
 * GET /api/health/feature-flags
 * Returns feature flag statistics
 */
export const featureFlagMetrics = (req: Request, res: Response) => {
  try {
    const stats = getFeatureFlagStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting feature flag stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feature flag statistics',
    });
  }
};

/**
 * Reset feature flag statistics endpoint
 * POST /api/health/feature-flags/reset
 * Admin only - resets feature flag tracking
 */
export const resetFeatureFlagMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetFeatureFlagStats();

    logger.info('Feature flag stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Feature flag statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting feature flag stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset feature flag statistics',
    });
  }
};

/**
 * API key statistics endpoint
 * GET /api/health/api-keys
 * Returns API key statistics
 */
export const apiKeyMetrics = (req: Request, res: Response) => {
  try {
    const stats = getApiKeyStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting API key stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API key statistics',
    });
  }
};

/**
 * Reset API key statistics endpoint
 * POST /api/health/api-keys/reset
 * Admin only - resets API key tracking
 */
export const resetApiKeyMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetApiKeyStats();

    logger.info('API key stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'API key statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting API key stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset API key statistics',
    });
  }
};

/**
 * Tiered rate limit statistics endpoint
 * GET /api/health/tiered-rate-limit
 * Returns tiered rate limit statistics
 */
export const tieredRateLimitMetrics = (req: Request, res: Response) => {
  try {
    const stats = getTieredRateLimitStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting tiered rate limit stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tiered rate limit statistics',
    });
  }
};

/**
 * Reset tiered rate limit statistics endpoint
 * POST /api/health/tiered-rate-limit/reset
 * Admin only - resets tiered rate limit tracking
 */
export const resetTieredRateLimitMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetTieredRateLimitStats();

    logger.info('Tiered rate limit stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Tiered rate limit statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting tiered rate limit stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset tiered rate limit statistics',
    });
  }
};

/**
 * Request batching statistics endpoint
 * GET /api/health/batching
 * Returns request batching statistics
 */
export const batchingMetrics = (req: Request, res: Response) => {
  try {
    const stats = getBatchStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting batching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve batching statistics',
    });
  }
};

/**
 * Reset batching statistics endpoint
 * POST /api/health/batching/reset
 * Admin only - resets batching tracking
 */
export const resetBatchingMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetBatchStats();

    logger.info('Batching stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Batching statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting batching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset batching statistics',
    });
  }
};

/**
 * WebSocket statistics endpoint
 * GET /api/health/websocket
 * Returns WebSocket connection statistics
 */
export const websocketMetrics = (req: Request, res: Response) => {
  try {
    const stats = getWebSocketStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting WebSocket stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve WebSocket statistics',
    });
  }
};

/**
 * File upload statistics endpoint
 * GET /api/health/file-upload
 * Returns file upload statistics
 */
export const fileUploadMetrics = (req: Request, res: Response) => {
  try {
    const stats = getFileUploadStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting file upload stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve file upload statistics',
    });
  }
};

/**
 * Reset file upload statistics endpoint
 * POST /api/health/file-upload/reset
 * Admin only - resets file upload tracking
 */
export const resetFileUploadMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetFileUploadStats();

    logger.info('File upload stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'File upload statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting file upload stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset file upload statistics',
    });
  }
};

/**
 * Data export statistics endpoint
 * GET /api/health/data-export
 * Returns data export statistics
 */
export const dataExportMetrics = (req: Request, res: Response) => {
  try {
    const stats = getDataExportStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting data export stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve data export statistics',
    });
  }
};

/**
 * Reset data export statistics endpoint
 * POST /api/health/data-export/reset
 * Admin only - resets data export tracking
 */
export const resetDataExportMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetDataExportStats();

    logger.info('Data export stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Data export statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting data export stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset data export statistics',
    });
  }
};

/**
 * Webhook statistics endpoint
 * GET /api/health/webhooks
 * Returns webhook statistics
 */
export const webhookMetrics = (req: Request, res: Response) => {
  try {
    const stats = getWebhookStats();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    logger.error('Error getting webhook stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve webhook statistics',
    });
  }
};

/**
 * Reset webhook statistics endpoint
 * POST /api/health/webhooks/reset
 * Admin only - resets webhook tracking
 */
export const resetWebhookMetricsEndpoint = (req: Request, res: Response) => {
  try {
    resetWebhookStats();

    logger.info('Webhook stats reset', { adminId: (req as any).user?.id });

    res.status(200).json({
      success: true,
      message: 'Webhook statistics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error resetting webhook stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset webhook statistics',
    });
  }
};
