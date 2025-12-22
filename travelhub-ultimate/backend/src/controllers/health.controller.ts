import { Request, Response } from 'express';
import { redisService } from '../services/redis.service.js';
import { prisma } from '../lib/prisma.js';
import logger from '../utils/logger.js';

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
 * Checks all critical dependencies (Database, Redis, etc.)
 */
export const detailedHealthCheck = async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: { status: 'unknown', responseTime: 0 } as ServiceStatus,
      redis: { status: 'unknown', responseTime: 0 } as ServiceStatus
    },
    system: {
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        unit: 'MB'
      },
      cpu: process.cpuUsage(),
      nodeVersion: process.version
    }
  };

  let hasErrors = false;

  // Check Database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart
    };
  } catch (error: any) {
    logger.error('Health check - Database error:', error);
    healthStatus.services.database = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message
    };
    hasErrors = true;
  }

  // Check Redis connection
  try {
    const redisStart = Date.now();
    await redisService.ping();
    healthStatus.services.redis = {
      status: 'healthy',
      responseTime: Date.now() - redisStart
    };
  } catch (error: any) {
    logger.error('Health check - Redis error:', error);
    healthStatus.services.redis = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message
    };
    hasErrors = true;
  }

  // Set overall status
  healthStatus.status = hasErrors ? 'degraded' : 'ok';

  // Return appropriate status code
  const statusCode = hasErrors ? 503 : 200;
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
