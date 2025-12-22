/**
 * Prometheus Metrics Service
 * Collect and expose application metrics for monitoring
 */

import client from 'prom-client';
import logger from '../utils/logger.js';

// Enable default metrics (CPU, memory, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
const Registry = client.Registry;
const register = new Registry();

collectDefaultMetrics({ register });

// Custom Metrics

// HTTP Metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestsInProgress = new client.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently in progress',
  labelNames: ['method', 'route'],
  registers: [register],
});

// Business Metrics
export const bookingsTotal = new client.Counter({
  name: 'bookings_total',
  help: 'Total number of bookings',
  labelNames: ['status', 'type'],
  registers: [register],
});

export const bookingRevenue = new client.Counter({
  name: 'booking_revenue_total',
  help: 'Total booking revenue',
  labelNames: ['currency'],
  registers: [register],
});

export const searchesTotal = new client.Counter({
  name: 'searches_total',
  help: 'Total number of searches',
  labelNames: ['type'],
  registers: [register],
});

export const usersTotal = new client.Gauge({
  name: 'users_total',
  help: 'Total number of registered users',
  registers: [register],
});

export const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register],
});

// Database Metrics
export const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register],
});

export const databaseConnectionsActive = new client.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

export const databaseQueriesTotal = new client.Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table'],
  registers: [register],
});

// Cache Metrics
export const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
  registers: [register],
});

export const cacheMissesTotal = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
  registers: [register],
});

export const cacheOperationDuration = new client.Histogram({
  name: 'cache_operation_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'cache_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Queue Metrics
export const queueJobsTotal = new client.Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue', 'status'],
  registers: [register],
});

export const queueJobDuration = new client.Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of queue job processing in seconds',
  labelNames: ['queue', 'job_type'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register],
});

export const queueSize = new client.Gauge({
  name: 'queue_size',
  help: 'Current size of the queue',
  labelNames: ['queue'],
  registers: [register],
});

// External API Metrics
export const externalApiCallsTotal = new client.Counter({
  name: 'external_api_calls_total',
  help: 'Total number of external API calls',
  labelNames: ['api', 'status'],
  registers: [register],
});

export const externalApiCallDuration = new client.Histogram({
  name: 'external_api_call_duration_seconds',
  help: 'Duration of external API calls in seconds',
  labelNames: ['api'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// Error Metrics
export const errorsTotal = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
  registers: [register],
});

export const uncaughtExceptionsTotal = new client.Counter({
  name: 'uncaught_exceptions_total',
  help: 'Total number of uncaught exceptions',
  registers: [register],
});

// Authentication Metrics
export const authAttemptsTotal = new client.Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'status'],
  registers: [register],
});

export const authTokensIssued = new client.Counter({
  name: 'auth_tokens_issued_total',
  help: 'Total number of authentication tokens issued',
  registers: [register],
});

// Rate Limiting Metrics
export const rateLimitExceeded = new client.Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total number of rate limit violations',
  labelNames: ['endpoint', 'user_type'],
  registers: [register],
});

/**
 * Metrics Service Class
 */
class MetricsService {
  private register: client.Registry;

  constructor() {
    this.register = register;
    logger.info('Metrics service initialized');
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return await this.register.metrics();
  }

  /**
   * Get metrics content type
   */
  getContentType(): string {
    return this.register.contentType;
  }

  /**
   * Clear all metrics
   */
  resetMetrics(): void {
    this.register.resetMetrics();
    logger.info('Metrics reset');
  }

  /**
   * Get metric by name
   */
  getMetric(name: string) {
    return this.register.getSingleMetric(name);
  }

  /**
   * Track HTTP request
   */
  trackHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): void {
    httpRequestTotal.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  }

  /**
   * Track search
   */
  trackSearch(type: 'flight' | 'hotel' | 'car'): void {
    searchesTotal.inc({ type });
  }

  /**
   * Track booking
   */
  trackBooking(status: string, type: string, revenue?: number, currency?: string): void {
    bookingsTotal.inc({ status, type });
    if (revenue && currency) {
      bookingRevenue.inc({ currency }, revenue);
    }
  }

  /**
   * Track cache operation
   */
  trackCacheHit(cacheName: string): void {
    cacheHitsTotal.inc({ cache_name: cacheName });
  }

  trackCacheMiss(cacheName: string): void {
    cacheMissesTotal.inc({ cache_name: cacheName });
  }

  /**
   * Track external API call
   */
  trackExternalApiCall(api: string, status: string, duration: number): void {
    externalApiCallsTotal.inc({ api, status });
    externalApiCallDuration.observe({ api }, duration);
  }

  /**
   * Track error
   */
  trackError(type: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    errorsTotal.inc({ type, severity });
  }

  /**
   * Track authentication attempt
   */
  trackAuthAttempt(method: string, status: 'success' | 'failure'): void {
    authAttemptsTotal.inc({ method, status });
    if (status === 'success') {
      authTokensIssued.inc();
    }
  }

  /**
   * Track rate limit exceeded
   */
  trackRateLimitExceeded(endpoint: string, userType: string): void {
    rateLimitExceeded.inc({ endpoint, user_type: userType });
  }

  /**
   * Update active users count
   */
  updateActiveUsers(count: number): void {
    activeUsers.set(count);
  }

  /**
   * Update total users count
   */
  updateTotalUsers(count: number): void {
    usersTotal.set(count);
  }

  /**
   * Update database connections
   */
  updateDatabaseConnections(count: number): void {
    databaseConnectionsActive.set(count);
  }

  /**
   * Track database query
   */
  trackDatabaseQuery(operation: string, table: string, duration: number): void {
    databaseQueriesTotal.inc({ operation, table });
    databaseQueryDuration.observe({ operation, table }, duration);
  }

  /**
   * Track queue job
   */
  trackQueueJob(
    queue: string,
    jobType: string,
    status: 'completed' | 'failed',
    duration: number
  ): void {
    queueJobsTotal.inc({ queue, status });
    queueJobDuration.observe({ queue, job_type: jobType }, duration);
  }

  /**
   * Update queue size
   */
  updateQueueSize(queue: string, size: number): void {
    queueSize.set({ queue }, size);
  }

  /**
   * Get all registered metrics summary
   */
  async getMetricsSummary(): Promise<any> {
    const metrics = await this.register.getMetricsAsJSON();
    return {
      totalMetrics: metrics.length,
      metrics: metrics.map((m: any) => ({
        name: m.name,
        help: m.help,
        type: m.type,
        values: m.values,
      })),
    };
  }
}

// Export singleton instance
export const metricsService = new MetricsService();
export default metricsService;
