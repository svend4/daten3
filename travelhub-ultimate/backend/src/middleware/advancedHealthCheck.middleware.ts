/**
 * Advanced Health Check Middleware
 * Enhanced dependency monitoring with custom checks
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { redisService } from '../services/redis.service.js';
import logger from '../utils/logger.js';

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Dependency check result
 */
interface DependencyCheckResult {
  name: string;
  status: HealthStatus;
  responseTime: number;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Health check configuration
 */
interface HealthCheckConfig {
  timeout: number;           // Timeout for each check (ms)
  thresholds: {
    database: number;        // Response time threshold for DB (ms)
    redis: number;           // Response time threshold for Redis (ms)
    externalAPI: number;     // Response time threshold for external APIs (ms)
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: HealthCheckConfig = {
  timeout: 5000, // 5 seconds
  thresholds: {
    database: 1000,      // 1 second
    redis: 500,          // 500ms
    externalAPI: 2000,   // 2 seconds
  },
};

/**
 * Health check statistics
 */
const stats = {
  totalChecks: 0,
  healthyChecks: 0,
  degradedChecks: 0,
  unhealthyChecks: 0,
  byDependency: new Map<string, {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    avgResponseTime: number;
  }>(),
  recentChecks: [] as Array<{
    dependency: string;
    status: HealthStatus;
    responseTime: number;
    timestamp: Date;
    error?: string;
  }>,
};

/**
 * Custom health check function type
 */
type HealthCheckFunction = () => Promise<DependencyCheckResult>;

/**
 * Registered custom health checks
 */
const customChecks: Map<string, HealthCheckFunction> = new Map();

/**
 * Register custom health check
 */
export const registerHealthCheck = (
  name: string,
  checkFn: HealthCheckFunction
): void => {
  customChecks.set(name, checkFn);

  // Initialize stats
  stats.byDependency.set(name, {
    total: 0,
    healthy: 0,
    degraded: 0,
    unhealthy: 0,
    avgResponseTime: 0,
  });

  logger.info(`Custom health check "${name}" registered`);
};

/**
 * Check Database health
 */
export const checkDatabase = async (config: HealthCheckConfig): Promise<DependencyCheckResult> => {
  const startTime = Date.now();

  try {
    // Execute simple query with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database check timeout')), config.timeout)
    );

    const queryPromise = prisma.$queryRaw`SELECT 1 as result`;

    await Promise.race([queryPromise, timeoutPromise]);

    const responseTime = Date.now() - startTime;

    // Determine status based on response time
    let status: HealthStatus;
    if (responseTime < config.thresholds.database / 2) {
      status = HealthStatus.HEALTHY;
    } else if (responseTime < config.thresholds.database) {
      status = HealthStatus.DEGRADED;
    } else {
      status = HealthStatus.UNHEALTHY;
    }

    return {
      name: 'database',
      status,
      responseTime,
      message: status === HealthStatus.HEALTHY ? 'Database is responsive' : 'Database is slow',
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      name: 'database',
      status: HealthStatus.UNHEALTHY,
      responseTime,
      error: error.message,
      message: 'Database connection failed',
    };
  }
};

/**
 * Check Redis health
 */
export const checkRedis = async (config: HealthCheckConfig): Promise<DependencyCheckResult> => {
  const startTime = Date.now();

  try {
    // Ping Redis with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis check timeout')), config.timeout)
    );

    const pingPromise = redisService.ping();

    await Promise.race([pingPromise, timeoutPromise]);

    const responseTime = Date.now() - startTime;

    // Determine status based on response time
    let status: HealthStatus;
    if (responseTime < config.thresholds.redis / 2) {
      status = HealthStatus.HEALTHY;
    } else if (responseTime < config.thresholds.redis) {
      status = HealthStatus.DEGRADED;
    } else {
      status = HealthStatus.UNHEALTHY;
    }

    return {
      name: 'redis',
      status,
      responseTime,
      message: status === HealthStatus.HEALTHY ? 'Redis is responsive' : 'Redis is slow',
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      name: 'redis',
      status: HealthStatus.DEGRADED, // Redis is not critical, so degraded instead of unhealthy
      responseTime,
      error: error.message,
      message: 'Redis connection failed',
    };
  }
};

/**
 * Check External API health (Travelpayouts)
 */
export const checkExternalAPI = async (config: HealthCheckConfig): Promise<DependencyCheckResult> => {
  const startTime = Date.now();

  try {
    // Check Travelpayouts API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch('https://api.travelpayouts.com/v1/flight_search_results?', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    // Determine status
    let status: HealthStatus;
    if (response.ok && responseTime < config.thresholds.externalAPI / 2) {
      status = HealthStatus.HEALTHY;
    } else if (response.ok && responseTime < config.thresholds.externalAPI) {
      status = HealthStatus.DEGRADED;
    } else {
      status = HealthStatus.DEGRADED; // External API not critical
    }

    return {
      name: 'external_api',
      status,
      responseTime,
      message: response.ok ? 'External API is responsive' : 'External API returned error',
      metadata: {
        statusCode: response.status,
        url: 'https://api.travelpayouts.com',
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      name: 'external_api',
      status: HealthStatus.DEGRADED, // External API not critical
      responseTime,
      error: error.message,
      message: 'External API check failed',
    };
  }
};

/**
 * Check system resources
 */
export const checkSystemResources = async (): Promise<DependencyCheckResult> => {
  const startTime = Date.now();

  try {
    const memUsage = process.memoryUsage();
    const memoryPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    // Determine status based on memory usage
    let status: HealthStatus;
    let message: string;

    if (memoryPercentage < 70) {
      status = HealthStatus.HEALTHY;
      message = 'System resources are healthy';
    } else if (memoryPercentage < 85) {
      status = HealthStatus.DEGRADED;
      message = 'High memory usage detected';
    } else {
      status = HealthStatus.UNHEALTHY;
      message = 'Critical memory usage';
    }

    const responseTime = Date.now() - startTime;

    return {
      name: 'system_resources',
      status,
      responseTime,
      message,
      metadata: {
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          percentage: memoryPercentage,
          unit: 'MB',
        },
        uptime: process.uptime(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      name: 'system_resources',
      status: HealthStatus.UNHEALTHY,
      responseTime,
      error: error.message,
      message: 'Failed to check system resources',
    };
  }
};

/**
 * Run all health checks
 */
export const runAllHealthChecks = async (
  config: HealthCheckConfig = DEFAULT_CONFIG
): Promise<{
  status: HealthStatus;
  checks: DependencyCheckResult[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}> => {
  const checks: DependencyCheckResult[] = [];

  // Run core checks in parallel
  const [dbCheck, redisCheck, apiCheck, resourceCheck] = await Promise.all([
    checkDatabase(config),
    checkRedis(config),
    checkExternalAPI(config),
    checkSystemResources(),
  ]);

  checks.push(dbCheck, redisCheck, apiCheck, resourceCheck);

  // Run custom checks
  for (const [name, checkFn] of customChecks.entries()) {
    try {
      const result = await checkFn();
      checks.push(result);
    } catch (error: any) {
      checks.push({
        name,
        status: HealthStatus.UNHEALTHY,
        responseTime: 0,
        error: error.message,
        message: `Custom check "${name}" failed`,
      });
    }
  }

  // Update statistics
  updateStats(checks);

  // Calculate summary
  const summary = {
    total: checks.length,
    healthy: checks.filter(c => c.status === HealthStatus.HEALTHY).length,
    degraded: checks.filter(c => c.status === HealthStatus.DEGRADED).length,
    unhealthy: checks.filter(c => c.status === HealthStatus.UNHEALTHY).length,
  };

  // Determine overall status
  let overallStatus: HealthStatus;
  if (summary.unhealthy > 0 && checks.find(c => c.name === 'database')?.status === HealthStatus.UNHEALTHY) {
    // Database is critical
    overallStatus = HealthStatus.UNHEALTHY;
  } else if (summary.unhealthy > 0 || summary.degraded > 0) {
    overallStatus = HealthStatus.DEGRADED;
  } else {
    overallStatus = HealthStatus.HEALTHY;
  }

  return {
    status: overallStatus,
    checks,
    summary,
  };
};

/**
 * Update statistics
 */
const updateStats = (checks: DependencyCheckResult[]): void => {
  for (const check of checks) {
    stats.totalChecks++;

    // Update overall stats
    if (check.status === HealthStatus.HEALTHY) {
      stats.healthyChecks++;
    } else if (check.status === HealthStatus.DEGRADED) {
      stats.degradedChecks++;
    } else {
      stats.unhealthyChecks++;
    }

    // Update dependency stats
    let depStats = stats.byDependency.get(check.name);
    if (!depStats) {
      depStats = {
        total: 0,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
        avgResponseTime: 0,
      };
      stats.byDependency.set(check.name, depStats);
    }

    depStats.total++;
    if (check.status === HealthStatus.HEALTHY) {
      depStats.healthy++;
    } else if (check.status === HealthStatus.DEGRADED) {
      depStats.degraded++;
    } else {
      depStats.unhealthy++;
    }

    // Update average response time
    depStats.avgResponseTime = Math.round(
      (depStats.avgResponseTime * (depStats.total - 1) + check.responseTime) / depStats.total
    );

    // Add to recent checks
    stats.recentChecks.push({
      dependency: check.name,
      status: check.status,
      responseTime: check.responseTime,
      timestamp: new Date(),
      error: check.error,
    });
  }

  // Keep only last 100 recent checks
  if (stats.recentChecks.length > 100) {
    stats.recentChecks = stats.recentChecks.slice(-100);
  }
};

/**
 * Get health check statistics
 */
export const getAdvancedHealthCheckStats = () => {
  const byDependency: Record<string, any> = {};
  for (const [name, depStats] of stats.byDependency.entries()) {
    byDependency[name] = { ...depStats };
  }

  return {
    totalChecks: stats.totalChecks,
    healthyChecks: stats.healthyChecks,
    degradedChecks: stats.degradedChecks,
    unhealthyChecks: stats.unhealthyChecks,
    byDependency,
    recentChecks: stats.recentChecks.slice(-20), // Last 20 checks
  };
};

/**
 * Reset health check statistics
 */
export const resetAdvancedHealthCheckStats = (): void => {
  stats.totalChecks = 0;
  stats.healthyChecks = 0;
  stats.degradedChecks = 0;
  stats.unhealthyChecks = 0;
  stats.byDependency.clear();
  stats.recentChecks = [];

  // Reinitialize default dependency stats
  const defaultDeps = ['database', 'redis', 'external_api', 'system_resources'];
  for (const dep of defaultDeps) {
    stats.byDependency.set(dep, {
      total: 0,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      avgResponseTime: 0,
    });
  }

  // Reinitialize custom check stats
  for (const name of customChecks.keys()) {
    stats.byDependency.set(name, {
      total: 0,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      avgResponseTime: 0,
    });
  }
};
