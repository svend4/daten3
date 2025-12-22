import { Request, Response } from 'express';
import { redisService } from '../services/redis.service.js';
import { prisma } from '../lib/prisma.js';
import logger from '../utils/logger.js';
import { getPerformanceMetrics } from '../middleware/logger.middleware.js';

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
