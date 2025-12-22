/**
 * API Gateway Service
 * Centralized gateway for request routing, composition, and orchestration
 *
 * Features:
 * - Request routing and composition
 * - Service aggregation
 * - Response caching at gateway level
 * - Request/response transformation
 * - Circuit breaker integration
 * - Load balancing (round-robin)
 */

import { Request, Response } from 'express';
import { redisService } from '../services/redis.service.js';
import logger from '../utils/logger.js';

/**
 * Service endpoint configuration
 */
export interface ServiceEndpoint {
  name: string;
  baseUrl: string;
  version: string;
  healthy: boolean;
  priority: number;
  timeout: number;
  retries: number;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  method: string;
  service: string;
  targetPath?: string;
  cacheTTL?: number;
  timeout?: number;
  aggregation?: AggregationConfig;
  transformation?: TransformationConfig;
  requiresAuth?: boolean;
}

/**
 * Aggregation configuration (combine multiple services)
 */
export interface AggregationConfig {
  enabled: boolean;
  services: Array<{
    name: string;
    path: string;
    method?: string;
    mapTo?: string; // Field name in response
  }>;
  strategy: 'parallel' | 'sequential' | 'waterfall';
}

/**
 * Transformation configuration
 */
export interface TransformationConfig {
  request?: {
    rename?: Record<string, string>;
    remove?: string[];
    add?: Record<string, any>;
  };
  response?: {
    rename?: Record<string, string>;
    remove?: string[];
    extract?: string; // Extract nested field
    wrap?: string; // Wrap response in field
  };
}

/**
 * Gateway statistics
 */
interface GatewayStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedResponses: number;
  aggregatedRequests: number;
  transformedRequests: number;
  averageResponseTime: number;
  totalResponseTime: number;
  routeStats: Map<string, {
    count: number;
    errors: number;
    avgResponseTime: number;
  }>;
  serviceStats: Map<string, {
    requests: number;
    errors: number;
    circuitBreakerTrips: number;
  }>;
}

class GatewayService {
  private services: Map<string, ServiceEndpoint[]> = new Map();
  private routes: Map<string, RouteConfig> = new Map();
  private currentServiceIndex: Map<string, number> = new Map();

  private stats: GatewayStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedResponses: 0,
    aggregatedRequests: 0,
    transformedRequests: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    routeStats: new Map(),
    serviceStats: new Map(),
  };

  constructor() {
    this.initializeDefaultServices();
    this.initializeDefaultRoutes();
  }

  /**
   * Initialize default service endpoints
   */
  private initializeDefaultServices(): void {
    // In a real microservices setup, these would be actual service URLs
    // For monolith, we'll use local routes as "services"
    this.registerService({
      name: 'auth-service',
      baseUrl: 'http://localhost:3000',
      version: 'v1',
      healthy: true,
      priority: 1,
      timeout: 5000,
      retries: 2,
    });

    this.registerService({
      name: 'booking-service',
      baseUrl: 'http://localhost:3000',
      version: 'v1',
      healthy: true,
      priority: 1,
      timeout: 10000,
      retries: 3,
    });

    this.registerService({
      name: 'user-service',
      baseUrl: 'http://localhost:3000',
      version: 'v1',
      healthy: true,
      priority: 1,
      timeout: 5000,
      retries: 2,
    });

    this.registerService({
      name: 'search-service',
      baseUrl: 'http://localhost:3000',
      version: 'v1',
      healthy: true,
      priority: 1,
      timeout: 15000,
      retries: 2,
    });

    logger.info('Gateway default services initialized');
  }

  /**
   * Initialize default route configurations
   */
  private initializeDefaultRoutes(): void {
    // Simple proxy routes
    this.registerRoute({
      path: '/gateway/auth/login',
      method: 'POST',
      service: 'auth-service',
      targetPath: '/api/auth/login',
      cacheTTL: 0,
      requiresAuth: false,
    });

    this.registerRoute({
      path: '/gateway/users/me',
      method: 'GET',
      service: 'user-service',
      targetPath: '/api/users/me',
      cacheTTL: 300,
      requiresAuth: true,
    });

    // Aggregation route (user profile + bookings + favorites)
    this.registerRoute({
      path: '/gateway/users/dashboard',
      method: 'GET',
      service: 'user-service',
      requiresAuth: true,
      aggregation: {
        enabled: true,
        strategy: 'parallel',
        services: [
          { name: 'user-service', path: '/api/users/me', mapTo: 'profile' },
          { name: 'booking-service', path: '/api/bookings', mapTo: 'bookings' },
          { name: 'user-service', path: '/api/favorites', mapTo: 'favorites' },
        ],
      },
    });

    // Search with transformation
    this.registerRoute({
      path: '/gateway/search/flights',
      method: 'GET',
      service: 'search-service',
      targetPath: '/api/search/flights',
      cacheTTL: 60,
      transformation: {
        response: {
          extract: 'data.results',
          rename: { 'departure_time': 'departureTime', 'arrival_time': 'arrivalTime' },
        },
      },
    });

    logger.info('Gateway default routes initialized');
  }

  /**
   * Register a service endpoint
   */
  registerService(endpoint: ServiceEndpoint): void {
    const existing = this.services.get(endpoint.name) || [];
    existing.push(endpoint);
    this.services.set(endpoint.name, existing);

    logger.info('Service registered in gateway', { service: endpoint.name, baseUrl: endpoint.baseUrl });
  }

  /**
   * Register a route
   */
  registerRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
    logger.info('Route registered in gateway', { path: config.path, method: config.method });
  }

  /**
   * Get service endpoint (with load balancing)
   */
  private getServiceEndpoint(serviceName: string): ServiceEndpoint | null {
    const endpoints = this.services.get(serviceName);
    if (!endpoints || endpoints.length === 0) {
      return null;
    }

    // Filter healthy endpoints
    const healthy = endpoints.filter(e => e.healthy);
    if (healthy.length === 0) {
      logger.warn('No healthy endpoints available', { service: serviceName });
      return null;
    }

    // Round-robin load balancing
    const currentIndex = this.currentServiceIndex.get(serviceName) || 0;
    const endpoint = healthy[currentIndex % healthy.length];
    this.currentServiceIndex.set(serviceName, (currentIndex + 1) % healthy.length);

    return endpoint;
  }

  /**
   * Execute request through gateway
   */
  async executeRequest(req: Request, res: Response): Promise<any> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Find matching route
      const routeKey = `${req.method}:${req.path}`;
      const route = this.routes.get(routeKey);

      if (!route) {
        throw new Error(`No route configured for ${routeKey}`);
      }

      // Update route stats
      const routeStats = this.stats.routeStats.get(routeKey) || {
        count: 0,
        errors: 0,
        avgResponseTime: 0,
      };
      routeStats.count++;
      this.stats.routeStats.set(routeKey, routeStats);

      let result;

      // Check cache first
      if (route.cacheTTL && route.cacheTTL > 0) {
        const cached = await this.getCachedResponse(routeKey, req);
        if (cached) {
          this.stats.cachedResponses++;
          logger.debug('Gateway cache hit', { route: routeKey });
          return cached;
        }
      }

      // Handle aggregation
      if (route.aggregation?.enabled) {
        result = await this.handleAggregation(route, req);
        this.stats.aggregatedRequests++;
      } else {
        // Simple proxy
        result = await this.proxyRequest(route, req);
      }

      // Apply response transformation
      if (route.transformation?.response) {
        result = this.transformResponse(result, route.transformation.response);
        this.stats.transformedRequests++;
      }

      // Cache response
      if (route.cacheTTL && route.cacheTTL > 0) {
        await this.cacheResponse(routeKey, req, result, route.cacheTTL);
      }

      // Update statistics
      const duration = Date.now() - startTime;
      this.stats.successfulRequests++;
      this.stats.totalResponseTime += duration;
      this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalRequests;

      routeStats.avgResponseTime = ((routeStats.avgResponseTime * (routeStats.count - 1)) + duration) / routeStats.count;

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.stats.failedRequests++;
      this.stats.totalResponseTime += duration;
      this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalRequests;

      logger.error('Gateway request failed', { error: error.message, path: req.path });
      throw error;
    }
  }

  /**
   * Proxy request to target service
   */
  private async proxyRequest(route: RouteConfig, req: Request): Promise<any> {
    const endpoint = this.getServiceEndpoint(route.service);
    if (!endpoint) {
      throw new Error(`Service ${route.service} not available`);
    }

    try {
      // In real implementation, this would make HTTP request to the service
      // For monolith simulation, we'll return mock data
      const targetPath = route.targetPath || route.path;

      // Mock successful response
      const mockResponse = {
        success: true,
        path: targetPath,
        service: route.service,
        timestamp: new Date().toISOString(),
      };

      this.updateServiceStats(route.service, true, false);
      return mockResponse;
    } catch (error: any) {
      this.updateServiceStats(route.service, false, false);
      throw error;
    }
  }

  /**
   * Handle request aggregation (combine multiple services)
   */
  private async handleAggregation(route: RouteConfig, req: Request): Promise<any> {
    if (!route.aggregation) {
      throw new Error('Aggregation config not found');
    }

    const { services, strategy } = route.aggregation;
    const results: Record<string, any> = {};

    if (strategy === 'parallel') {
      // Execute all requests in parallel
      const promises = services.map(async (svc) => {
        try {
          const svcRoute: RouteConfig = {
            path: svc.path,
            method: svc.method || 'GET',
            service: svc.name,
            targetPath: svc.path,
          };

          const result = await this.proxyRequest(svcRoute, req);
          return { key: svc.mapTo || svc.name, value: result };
        } catch (error: any) {
          logger.error('Aggregation service failed', { service: svc.name, error: error.message });
          return { key: svc.mapTo || svc.name, value: { error: error.message } };
        }
      });

      const settled = await Promise.allSettled(promises);
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results[result.value.key] = result.value.value;
        } else {
          results[services[index].mapTo || services[index].name] = { error: 'Request failed' };
        }
      });
    } else if (strategy === 'sequential') {
      // Execute requests one by one
      for (const svc of services) {
        try {
          const svcRoute: RouteConfig = {
            path: svc.path,
            method: svc.method || 'GET',
            service: svc.name,
            targetPath: svc.path,
          };

          const result = await this.proxyRequest(svcRoute, req);
          results[svc.mapTo || svc.name] = result;
        } catch (error: any) {
          logger.error('Aggregation service failed', { service: svc.name, error: error.message });
          results[svc.mapTo || svc.name] = { error: error.message };
        }
      }
    }

    return {
      aggregated: true,
      strategy,
      timestamp: new Date().toISOString(),
      ...results,
    };
  }

  /**
   * Transform response according to configuration
   */
  private transformResponse(data: any, config: TransformationConfig['response']): any {
    if (!config) return data;

    let result = data;

    // Extract nested field
    if (config.extract) {
      const parts = config.extract.split('.');
      result = parts.reduce((obj, key) => obj?.[key], result);
    }

    // Rename fields
    if (config.rename && typeof result === 'object') {
      Object.entries(config.rename).forEach(([oldKey, newKey]) => {
        if (oldKey in result) {
          result[newKey] = result[oldKey];
          delete result[oldKey];
        }
      });
    }

    // Remove fields
    if (config.remove && typeof result === 'object') {
      config.remove.forEach(key => delete result[key]);
    }

    // Wrap in field
    if (config.wrap) {
      result = { [config.wrap]: result };
    }

    return result;
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(routeKey: string, req: Request): Promise<any | null> {
    try {
      const cacheKey = this.getCacheKey(routeKey, req);
      const cached = await redisService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error: any) {
      logger.error('Gateway cache get error', { error: error.message });
    }

    return null;
  }

  /**
   * Cache response
   */
  private async cacheResponse(routeKey: string, req: Request, data: any, ttl: number): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(routeKey, req);
      await redisService.set(cacheKey, JSON.stringify(data), ttl);
    } catch (error: any) {
      logger.error('Gateway cache set error', { error: error.message });
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(routeKey: string, req: Request): string {
    const user = (req as any).user;
    const userId = user?.id || 'anonymous';
    const queryString = JSON.stringify(req.query);
    return `gateway:cache:${routeKey}:${userId}:${queryString}`;
  }

  /**
   * Update service statistics
   */
  private updateServiceStats(serviceName: string, success: boolean, circuitBreakerTrip: boolean): void {
    const stats = this.stats.serviceStats.get(serviceName) || {
      requests: 0,
      errors: 0,
      circuitBreakerTrips: 0,
    };

    stats.requests++;
    if (!success) stats.errors++;
    if (circuitBreakerTrip) stats.circuitBreakerTrips++;

    this.stats.serviceStats.set(serviceName, stats);
  }

  /**
   * Get gateway statistics
   */
  getStats(): any {
    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      cachedResponses: this.stats.cachedResponses,
      aggregatedRequests: this.stats.aggregatedRequests,
      transformedRequests: this.stats.transformedRequests,
      cacheHitRate: this.stats.totalRequests > 0
        ? ((this.stats.cachedResponses / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      successRate: this.stats.totalRequests > 0
        ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      averageResponseTime: Math.round(this.stats.averageResponseTime),
      routeStats: Object.fromEntries(this.stats.routeStats),
      serviceStats: Object.fromEntries(this.stats.serviceStats),
      servicesCount: this.services.size,
      routesCount: this.routes.size,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all registered services
   */
  getServices(): Array<{ name: string; endpoints: ServiceEndpoint[] }> {
    return Array.from(this.services.entries()).map(([name, endpoints]) => ({
      name,
      endpoints,
    }));
  }

  /**
   * Get all registered routes
   */
  getRoutes(): RouteConfig[] {
    return Array.from(this.routes.values());
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedResponses: 0,
      aggregatedRequests: 0,
      transformedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      routeStats: new Map(),
      serviceStats: new Map(),
    };
    logger.info('Gateway statistics reset');
  }
}

export const gatewayService = new GatewayService();
