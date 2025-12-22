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
