/**
 * Service Mesh - Control Plane
 * Centralized management and orchestration of service mesh features
 *
 * Coordinates:
 * - Service registry
 * - Retry policies
 * - Traffic routing
 * - Service authentication
 */

import { serviceRegistry, LoadBalancingStrategy } from './serviceRegistry.js';
import { retryPolicyService } from './retryPolicy.js';
import { trafficRouter, RoutingContext } from './trafficRouter.js';
import { serviceAuth } from './serviceAuth.js';
import logger from '../utils/logger.js';

/**
 * Service mesh configuration
 */
export interface MeshConfig {
  enabled: boolean;
  serviceDiscovery: boolean;
  retryPolicy: boolean;
  trafficRouting: boolean;
  serviceAuth: boolean;
  healthChecking: boolean;
  observability: boolean;
}

/**
 * Service call options
 */
export interface ServiceCallOptions {
  targetService: string;
  targetVersion?: string;
  loadBalancing?: LoadBalancingStrategy;
  routingContext?: RoutingContext;
  retryEnabled?: boolean;
  authEnabled?: boolean;
  permission?: string;
}

/**
 * Control plane statistics
 */
interface ControlPlaneStats {
  totalServiceCalls: number;
  successfulCalls: number;
  failedCalls: number;
  routedCalls: number;
  authenticatedCalls: number;
  averageCallTime: number;
  totalCallTime: number;
}

class ServiceMeshControlPlane {
  private config: MeshConfig = {
    enabled: process.env.SERVICE_MESH_ENABLED === 'true',
    serviceDiscovery: true,
    retryPolicy: true,
    trafficRouting: true,
    serviceAuth: false, // Disabled by default
    healthChecking: true,
    observability: true,
  };

  private stats: ControlPlaneStats = {
    totalServiceCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    routedCalls: 0,
    authenticatedCalls: 0,
    averageCallTime: 0,
    totalCallTime: 0,
  };

  /**
   * Initialize service mesh
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Service mesh is disabled');
      return;
    }

    logger.info('Initializing service mesh control plane', { config: this.config });

    // Register default services
    this.registerDefaultServices();

    // Register default retry policies
    this.registerDefaultRetryPolicies();

    logger.info('Service mesh control plane initialized');
  }

  /**
   * Execute service call through mesh
   */
  async call<T>(
    sourceServiceId: string,
    options: ServiceCallOptions,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.enabled) {
      return await fn();
    }

    const startTime = Date.now();
    this.stats.totalServiceCalls++;

    try {
      // 1. Traffic routing (determine target version)
      let targetVersion = options.targetVersion;
      if (this.config.trafficRouting && options.routingContext) {
        const routedVersion = trafficRouter.route(options.targetService, options.routingContext);
        if (routedVersion) {
          targetVersion = routedVersion;
          this.stats.routedCalls++;
        }
      }

      // 2. Service discovery (get instance)
      const instance = serviceRegistry.getInstance(
        options.targetService,
        options.loadBalancing || LoadBalancingStrategy.ROUND_ROBIN,
        { version: targetVersion }
      );

      if (!instance) {
        throw new Error(`No healthy instances for service: ${options.targetService}`);
      }

      logger.debug('Service mesh call', {
        source: sourceServiceId,
        target: options.targetService,
        version: instance.version,
        instance: instance.id,
      });

      // 3. Service authentication (if enabled)
      if (this.config.serviceAuth && options.authEnabled) {
        const payload = JSON.stringify({
          source: sourceServiceId,
          target: options.targetService,
          timestamp: Date.now(),
        });

        const signature = serviceAuth.signRequest(sourceServiceId, payload);
        if (!signature) {
          throw new Error('Failed to sign request');
        }

        const isAuthorized = serviceAuth.authenticateRequest(
          sourceServiceId,
          options.targetService,
          payload,
          signature,
          options.permission
        );

        if (!isAuthorized) {
          throw new Error('Service authentication failed');
        }

        this.stats.authenticatedCalls++;
      }

      // 4. Execute with retry policy (if enabled)
      let result: T;
      if (this.config.retryPolicy && options.retryEnabled !== false) {
        result = await retryPolicyService.execute(options.targetService, fn);
      } else {
        result = await fn();
      }

      // 5. Release connection (for load balancing)
      serviceRegistry.releaseConnection(instance.id);

      // Update stats
      const duration = Date.now() - startTime;
      this.stats.successfulCalls++;
      this.stats.totalCallTime += duration;
      this.stats.averageCallTime = this.stats.totalCallTime / this.stats.totalServiceCalls;

      return result;
    } catch (error: any) {
      this.stats.failedCalls++;
      const duration = Date.now() - startTime;
      this.stats.totalCallTime += duration;
      this.stats.averageCallTime = this.stats.totalCallTime / this.stats.totalServiceCalls;

      logger.error('Service mesh call failed', {
        source: sourceServiceId,
        target: options.targetService,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<MeshConfig>): void {
    Object.assign(this.config, updates);
    logger.info('Service mesh configuration updated', { config: this.config });
  }

  /**
   * Get configuration
   */
  getConfig(): MeshConfig {
    return { ...this.config };
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): any {
    return {
      controlPlane: {
        ...this.stats,
        successRate: this.stats.totalServiceCalls > 0
          ? ((this.stats.successfulCalls / this.stats.totalServiceCalls) * 100).toFixed(2) + '%'
          : '0%',
        averageCallTime: Math.round(this.stats.averageCallTime),
      },
      serviceRegistry: serviceRegistry.getStats(),
      retryPolicy: retryPolicyService.getStats(),
      trafficRouter: trafficRouter.getStats(),
      serviceAuth: serviceAuth.getStats(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset all statistics
   */
  resetAllStats(): void {
    this.stats = {
      totalServiceCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      routedCalls: 0,
      authenticatedCalls: 0,
      averageCallTime: 0,
      totalCallTime: 0,
    };

    serviceRegistry.resetStats();
    retryPolicyService.resetStats();
    trafficRouter.resetStats();
    serviceAuth.resetStats();

    logger.info('All service mesh statistics reset');
  }

  /**
   * Get service mesh health status
   */
  getHealth(): any {
    const registryStats = serviceRegistry.getStats();

    return {
      status: this.config.enabled ? 'enabled' : 'disabled',
      healthy: registryStats.healthyInstances > 0,
      services: {
        total: registryStats.totalServices,
        instances: {
          total: registryStats.totalInstances,
          healthy: registryStats.healthyInstances,
          unhealthy: registryStats.unhealthyInstances,
        },
      },
      features: this.config,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Register default services
   */
  private registerDefaultServices(): void {
    // In a real microservices setup, services would auto-register
    // For monolith, we register logical service boundaries

    serviceRegistry.register({
      name: 'booking-service',
      version: 'v1',
      host: 'localhost',
      port: 3000,
      healthCheckUrl: '/health',
      tags: ['core', 'business'],
    });

    serviceRegistry.register({
      name: 'user-service',
      version: 'v1',
      host: 'localhost',
      port: 3000,
      healthCheckUrl: '/health',
      tags: ['core', 'auth'],
    });

    serviceRegistry.register({
      name: 'payment-service',
      version: 'v1',
      host: 'localhost',
      port: 3000,
      healthCheckUrl: '/health',
      tags: ['core', 'business', 'sensitive'],
    });

    serviceRegistry.register({
      name: 'notification-service',
      version: 'v1',
      host: 'localhost',
      port: 3000,
      healthCheckUrl: '/health',
      tags: ['support'],
    });

    logger.info('Default services registered');
  }

  /**
   * Register default retry policies
   */
  private registerDefaultRetryPolicies(): void {
    // Conservative retry for payment service
    retryPolicyService.registerPolicy('payment-service', {
      maxAttempts: 2,
      baseDelay: 500,
      maxDelay: 2000,
      exponentialBase: 1.5,
      retryBudget: 10, // Very low retry budget for payments
    });

    // Aggressive retry for notification service
    retryPolicyService.registerPolicy('notification-service', {
      maxAttempts: 5,
      baseDelay: 100,
      maxDelay: 10000,
      exponentialBase: 2,
      retryBudget: 50,
    });

    // Standard retry for other services
    retryPolicyService.registerPolicy('booking-service', {
      maxAttempts: 3,
      baseDelay: 200,
      maxDelay: 5000,
    });

    logger.info('Default retry policies registered');
  }
}

export const serviceMesh = new ServiceMeshControlPlane();
