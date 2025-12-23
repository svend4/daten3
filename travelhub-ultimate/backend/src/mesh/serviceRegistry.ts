/**
 * Service Mesh - Service Registry
 * Service discovery and registration with health tracking
 *
 * Provides:
 * - Dynamic service registration/deregistration
 * - Health checking and automatic failover
 * - Service discovery by name
 * - Load balancing strategies
 * - Service metadata management
 */

import logger from '../utils/logger.js';

/**
 * Service instance metadata
 */
export interface ServiceInstance {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  healthy: boolean;
  weight: number; // For weighted load balancing
  metadata: Record<string, any>;
  registeredAt: Date;
  lastHealthCheck?: Date;
  healthCheckUrl?: string;
  tags: string[];
}

/**
 * Service registration options
 */
export interface RegisterOptions {
  name: string;
  version: string;
  host: string;
  port: number;
  protocol?: 'http' | 'https';
  weight?: number;
  metadata?: Record<string, any>;
  healthCheckUrl?: string;
  tags?: string[];
}

/**
 * Load balancing strategy
 */
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  RANDOM = 'random',
  WEIGHTED = 'weighted',
  LEAST_CONNECTIONS = 'least_connections',
}

/**
 * Service registry statistics
 */
interface RegistryStats {
  totalServices: number;
  totalInstances: number;
  healthyInstances: number;
  unhealthyInstances: number;
  registrations: number;
  deregistrations: number;
  healthChecks: number;
  failedHealthChecks: number;
  discoveryRequests: number;
}

/**
 * Service Registry class
 */
class ServiceRegistry {
  private services: Map<string, ServiceInstance[]> = new Map();
  private instanceConnections: Map<string, number> = new Map(); // For least connections
  private loadBalancerIndex: Map<string, number> = new Map();

  private stats: RegistryStats = {
    totalServices: 0,
    totalInstances: 0,
    healthyInstances: 0,
    unhealthyInstances: 0,
    registrations: 0,
    deregistrations: 0,
    healthChecks: 0,
    failedHealthChecks: 0,
    discoveryRequests: 0,
  };

  /**
   * Register a service instance
   */
  register(options: RegisterOptions): ServiceInstance {
    const instance: ServiceInstance = {
      id: this.generateInstanceId(options.name),
      name: options.name,
      version: options.version,
      host: options.host,
      port: options.port,
      protocol: options.protocol || 'http',
      healthy: true,
      weight: options.weight || 1,
      metadata: options.metadata || {},
      registeredAt: new Date(),
      healthCheckUrl: options.healthCheckUrl,
      tags: options.tags || [],
    };

    const instances = this.services.get(options.name) || [];
    instances.push(instance);
    this.services.set(options.name, instances);

    // Initialize connection counter
    this.instanceConnections.set(instance.id, 0);

    // Update stats
    this.stats.registrations++;
    this.stats.totalInstances++;
    this.stats.healthyInstances++;
    this.updateServiceCount();

    logger.info('Service instance registered', {
      service: instance.name,
      id: instance.id,
      version: instance.version,
      endpoint: `${instance.protocol}://${instance.host}:${instance.port}`,
    });

    return instance;
  }

  /**
   * Deregister a service instance
   */
  deregister(serviceName: string, instanceId: string): boolean {
    const instances = this.services.get(serviceName);
    if (!instances) return false;

    const index = instances.findIndex(i => i.id === instanceId);
    if (index === -1) return false;

    const instance = instances[index];
    instances.splice(index, 1);

    if (instances.length === 0) {
      this.services.delete(serviceName);
    } else {
      this.services.set(serviceName, instances);
    }

    // Remove connection counter
    this.instanceConnections.delete(instanceId);

    // Update stats
    this.stats.deregistrations++;
    this.stats.totalInstances--;
    if (instance.healthy) {
      this.stats.healthyInstances--;
    } else {
      this.stats.unhealthyInstances--;
    }
    this.updateServiceCount();

    logger.info('Service instance deregistered', {
      service: serviceName,
      id: instanceId,
    });

    return true;
  }

  /**
   * Discover service instances
   */
  discover(
    serviceName: string,
    options?: {
      version?: string;
      tags?: string[];
      onlyHealthy?: boolean;
    }
  ): ServiceInstance[] {
    this.stats.discoveryRequests++;

    const instances = this.services.get(serviceName) || [];
    let filtered = instances;

    // Filter by health
    if (options?.onlyHealthy !== false) {
      filtered = filtered.filter(i => i.healthy);
    }

    // Filter by version
    if (options?.version) {
      filtered = filtered.filter(i => i.version === options.version);
    }

    // Filter by tags
    if (options?.tags && options.tags.length > 0) {
      filtered = filtered.filter(i =>
        options.tags!.every(tag => i.tags.includes(tag))
      );
    }

    return filtered;
  }

  /**
   * Get service instance using load balancing
   */
  getInstance(
    serviceName: string,
    strategy: LoadBalancingStrategy = LoadBalancingStrategy.ROUND_ROBIN,
    options?: {
      version?: string;
      tags?: string[];
    }
  ): ServiceInstance | null {
    const instances = this.discover(serviceName, { ...options, onlyHealthy: true });

    if (instances.length === 0) {
      logger.warn('No healthy instances available', { service: serviceName });
      return null;
    }

    let selected: ServiceInstance | null = null;

    switch (strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        selected = this.roundRobinSelect(serviceName, instances);
        break;

      case LoadBalancingStrategy.RANDOM:
        selected = instances[Math.floor(Math.random() * instances.length)];
        break;

      case LoadBalancingStrategy.WEIGHTED:
        selected = this.weightedSelect(instances);
        break;

      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        selected = this.leastConnectionsSelect(instances);
        break;

      default:
        selected = instances[0];
    }

    // Increment connection counter
    if (selected) {
      const count = this.instanceConnections.get(selected.id) || 0;
      this.instanceConnections.set(selected.id, count + 1);
    }

    return selected;
  }

  /**
   * Release connection (for least connections strategy)
   */
  releaseConnection(instanceId: string): void {
    const count = this.instanceConnections.get(instanceId);
    if (count !== undefined && count > 0) {
      this.instanceConnections.set(instanceId, count - 1);
    }
  }

  /**
   * Mark instance as healthy/unhealthy
   */
  setHealth(serviceName: string, instanceId: string, healthy: boolean): boolean {
    const instances = this.services.get(serviceName);
    if (!instances) return false;

    const instance = instances.find(i => i.id === instanceId);
    if (!instance) return false;

    const wasHealthy = instance.healthy;
    instance.healthy = healthy;
    instance.lastHealthCheck = new Date();

    // Update stats
    if (wasHealthy && !healthy) {
      this.stats.healthyInstances--;
      this.stats.unhealthyInstances++;
      this.stats.failedHealthChecks++;
    } else if (!wasHealthy && healthy) {
      this.stats.unhealthyInstances--;
      this.stats.healthyInstances++;
    }

    this.stats.healthChecks++;

    logger.debug('Instance health updated', {
      service: serviceName,
      id: instanceId,
      healthy,
    });

    return true;
  }

  /**
   * Get all registered services
   */
  getAllServices(): Array<{ name: string; instances: ServiceInstance[] }> {
    return Array.from(this.services.entries()).map(([name, instances]) => ({
      name,
      instances,
    }));
  }

  /**
   * Get service by name
   */
  getService(name: string): ServiceInstance[] | undefined {
    return this.services.get(name);
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats & { timestamp: string } {
    return {
      ...this.stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.registrations = 0;
    this.stats.deregistrations = 0;
    this.stats.healthChecks = 0;
    this.stats.failedHealthChecks = 0;
    this.stats.discoveryRequests = 0;
    logger.info('Service registry statistics reset');
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Generate unique instance ID
   */
  private generateInstanceId(serviceName: string): string {
    return `${serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Round-robin selection
   */
  private roundRobinSelect(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const currentIndex = this.loadBalancerIndex.get(serviceName) || 0;
    const selected = instances[currentIndex % instances.length];
    this.loadBalancerIndex.set(serviceName, (currentIndex + 1) % instances.length);
    return selected;
  }

  /**
   * Weighted random selection
   */
  private weightedSelect(instances: ServiceInstance[]): ServiceInstance {
    const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
    let random = Math.random() * totalWeight;

    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }

    return instances[instances.length - 1];
  }

  /**
   * Least connections selection
   */
  private leastConnectionsSelect(instances: ServiceInstance[]): ServiceInstance {
    let selected = instances[0];
    let minConnections = this.instanceConnections.get(selected.id) || 0;

    for (const instance of instances) {
      const connections = this.instanceConnections.get(instance.id) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selected = instance;
      }
    }

    return selected;
  }

  /**
   * Update service count
   */
  private updateServiceCount(): void {
    this.stats.totalServices = this.services.size;
  }
}

export const serviceRegistry = new ServiceRegistry();
