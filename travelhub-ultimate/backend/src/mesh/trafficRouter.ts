/**
 * Service Mesh - Traffic Router
 * Advanced traffic routing with canary deployments and A/B testing
 *
 * Features:
 * - Traffic splitting by percentage
 * - Canary deployments with gradual rollout
 * - A/B testing with user targeting
 * - Header-based routing
 * - Geographic routing
 * - Version-based routing
 */

import logger from '../utils/logger.js';

/**
 * Traffic route configuration
 */
export interface TrafficRoute {
  id: string;
  name: string;
  serviceName: string;
  enabled: boolean;
  rules: RoutingRule[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Routing rule
 */
export interface RoutingRule {
  type: 'percentage' | 'header' | 'user' | 'geo' | 'version';
  priority: number; // Higher priority evaluated first
  destinations: RouteDestination[];
  conditions?: RouteCondition[];
}

/**
 * Route destination with weight
 */
export interface RouteDestination {
  version: string;
  weight: number; // 0-100 percentage
  tags?: string[];
}

/**
 * Route condition
 */
export interface RouteCondition {
  type: 'header' | 'query' | 'user_id' | 'user_role' | 'geo_country' | 'geo_region';
  key: string;
  operator: 'equals' | 'contains' | 'regex' | 'in';
  value: string | string[];
}

/**
 * Routing context (request metadata)
 */
export interface RoutingContext {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  userId?: string;
  userRole?: string;
  geoCountry?: string;
  geoRegion?: string;
}

/**
 * Canary deployment configuration
 */
export interface CanaryDeployment {
  id: string;
  serviceName: string;
  canaryVersion: string;
  stableVersion: string;
  trafficPercentage: number; // 0-100
  autoIncrement: boolean;
  incrementStep: number; // Percentage to increase per interval
  incrementInterval: number; // Milliseconds between increments
  maxTraffic: number; // Maximum traffic percentage
  enabled: boolean;
  createdAt: Date;
  nextIncrementAt?: Date;
}

/**
 * Traffic routing statistics
 */
interface RoutingStats {
  totalRequests: number;
  routedByVersion: Map<string, number>;
  routedByRule: Map<string, number>;
  canaryDeployments: number;
  activeCanaries: number;
  failedRoutes: number;
}

class TrafficRouterService {
  private routes: Map<string, TrafficRoute> = new Map();
  private canaries: Map<string, CanaryDeployment> = new Map();
  private stats: RoutingStats = {
    totalRequests: 0,
    routedByVersion: new Map(),
    routedByRule: new Map(),
    canaryDeployments: 0,
    activeCanaries: 0,
    failedRoutes: 0,
  };

  constructor() {
    // Start canary auto-increment timer
    this.startCanaryAutoIncrement();
  }

  /**
   * Create traffic route
   */
  createRoute(config: Omit<TrafficRoute, 'id' | 'createdAt' | 'updatedAt'>): TrafficRoute {
    const route: TrafficRoute = {
      id: this.generateId(),
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.routes.set(route.id, route);
    logger.info('Traffic route created', { routeId: route.id, service: route.serviceName });

    return route;
  }

  /**
   * Update traffic route
   */
  updateRoute(routeId: string, updates: Partial<TrafficRoute>): boolean {
    const route = this.routes.get(routeId);
    if (!route) return false;

    Object.assign(route, updates, { updatedAt: new Date() });
    this.routes.set(routeId, route);

    logger.info('Traffic route updated', { routeId });
    return true;
  }

  /**
   * Delete traffic route
   */
  deleteRoute(routeId: string): boolean {
    const deleted = this.routes.delete(routeId);
    if (deleted) {
      logger.info('Traffic route deleted', { routeId });
    }
    return deleted;
  }

  /**
   * Create canary deployment
   */
  createCanary(config: Omit<CanaryDeployment, 'id' | 'createdAt' | 'nextIncrementAt'>): CanaryDeployment {
    const canary: CanaryDeployment = {
      id: this.generateId(),
      ...config,
      createdAt: new Date(),
      nextIncrementAt: config.autoIncrement
        ? new Date(Date.now() + config.incrementInterval)
        : undefined,
    };

    this.canaries.set(canary.id, canary);
    this.stats.canaryDeployments++;
    if (canary.enabled) {
      this.stats.activeCanaries++;
    }

    logger.info('Canary deployment created', {
      canaryId: canary.id,
      service: canary.serviceName,
      canaryVersion: canary.canaryVersion,
      traffic: canary.trafficPercentage,
    });

    return canary;
  }

  /**
   * Update canary traffic percentage
   */
  updateCanaryTraffic(canaryId: string, percentage: number): boolean {
    const canary = this.canaries.get(canaryId);
    if (!canary) return false;

    canary.trafficPercentage = Math.min(percentage, canary.maxTraffic);
    canary.nextIncrementAt = canary.autoIncrement
      ? new Date(Date.now() + canary.incrementInterval)
      : undefined;

    logger.info('Canary traffic updated', {
      canaryId,
      newPercentage: canary.trafficPercentage,
    });

    return true;
  }

  /**
   * Promote canary to stable
   */
  promoteCanary(canaryId: string): boolean {
    const canary = this.canaries.get(canaryId);
    if (!canary) return false;

    // Set canary to 100% traffic
    canary.trafficPercentage = 100;
    canary.enabled = false;
    if (canary.enabled) {
      this.stats.activeCanaries--;
    }

    logger.info('Canary promoted to stable', {
      canaryId,
      service: canary.serviceName,
      version: canary.canaryVersion,
    });

    return true;
  }

  /**
   * Rollback canary
   */
  rollbackCanary(canaryId: string): boolean {
    const canary = this.canaries.get(canaryId);
    if (!canary) return false;

    canary.trafficPercentage = 0;
    canary.enabled = false;
    if (canary.enabled) {
      this.stats.activeCanaries--;
    }

    logger.info('Canary rolled back', {
      canaryId,
      service: canary.serviceName,
    });

    return true;
  }

  /**
   * Route request to appropriate service version
   */
  route(serviceName: string, context: RoutingContext = {}): string | null {
    this.stats.totalRequests++;

    // Check for canary deployments first
    const canary = this.getActiveCanary(serviceName);
    if (canary) {
      const version = this.routeCanary(canary, context);
      if (version) {
        this.trackVersionRoute(version);
        return version;
      }
    }

    // Check for custom routes
    const routes = this.getServiceRoutes(serviceName);
    if (routes.length > 0) {
      const version = this.routeByRules(routes, context);
      if (version) {
        this.trackVersionRoute(version);
        return version;
      }
    }

    // No routing rules - return null (use default)
    return null;
  }

  /**
   * Route canary deployment
   */
  private routeCanary(canary: CanaryDeployment, context: RoutingContext): string | null {
    const random = Math.random() * 100;

    if (random < canary.trafficPercentage) {
      logger.debug('Routing to canary version', {
        canary: canary.canaryVersion,
        traffic: canary.trafficPercentage,
      });
      return canary.canaryVersion;
    } else {
      return canary.stableVersion;
    }
  }

  /**
   * Route by custom rules
   */
  private routeByRules(routes: TrafficRoute[], context: RoutingContext): string | null {
    // Sort by priority
    const sortedRules: Array<{ route: TrafficRoute; rule: RoutingRule }> = [];

    for (const route of routes) {
      for (const rule of route.rules) {
        sortedRules.push({ route, rule });
      }
    }

    sortedRules.sort((a, b) => b.rule.priority - a.rule.priority);

    // Evaluate rules in priority order
    for (const { route, rule } of sortedRules) {
      if (this.evaluateRule(rule, context)) {
        const version = this.selectDestination(rule.destinations);
        if (version) {
          this.trackRuleRoute(route.id);
          return version;
        }
      }
    }

    return null;
  }

  /**
   * Evaluate routing rule
   */
  private evaluateRule(rule: RoutingRule, context: RoutingContext): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true; // No conditions = always match
    }

    // All conditions must match (AND logic)
    return rule.conditions.every(condition => this.evaluateCondition(condition, context));
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: RouteCondition, context: RoutingContext): boolean {
    let actualValue: string | undefined;

    // Get actual value from context
    switch (condition.type) {
      case 'header':
        actualValue = context.headers?.[condition.key];
        break;
      case 'query':
        actualValue = context.query?.[condition.key];
        break;
      case 'user_id':
        actualValue = context.userId;
        break;
      case 'user_role':
        actualValue = context.userRole;
        break;
      case 'geo_country':
        actualValue = context.geoCountry;
        break;
      case 'geo_region':
        actualValue = context.geoRegion;
        break;
    }

    if (!actualValue) return false;

    // Evaluate condition
    switch (condition.operator) {
      case 'equals':
        return actualValue === condition.value;

      case 'contains':
        return actualValue.includes(condition.value as string);

      case 'regex':
        const regex = new RegExp(condition.value as string);
        return regex.test(actualValue);

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(actualValue);

      default:
        return false;
    }
  }

  /**
   * Select destination based on weights
   */
  private selectDestination(destinations: RouteDestination[]): string | null {
    if (destinations.length === 0) return null;
    if (destinations.length === 1) return destinations[0].version;

    // Weighted random selection
    const totalWeight = destinations.reduce((sum, d) => sum + d.weight, 0);
    let random = Math.random() * totalWeight;

    for (const dest of destinations) {
      random -= dest.weight;
      if (random <= 0) {
        return dest.version;
      }
    }

    return destinations[destinations.length - 1].version;
  }

  /**
   * Get active canary for service
   */
  private getActiveCanary(serviceName: string): CanaryDeployment | null {
    for (const canary of this.canaries.values()) {
      if (canary.serviceName === serviceName && canary.enabled && canary.trafficPercentage > 0) {
        return canary;
      }
    }
    return null;
  }

  /**
   * Get routes for service
   */
  private getServiceRoutes(serviceName: string): TrafficRoute[] {
    return Array.from(this.routes.values()).filter(
      route => route.serviceName === serviceName && route.enabled
    );
  }

  /**
   * Start canary auto-increment timer
   */
  private startCanaryAutoIncrement(): void {
    setInterval(() => {
      const now = Date.now();

      for (const canary of this.canaries.values()) {
        if (
          canary.enabled &&
          canary.autoIncrement &&
          canary.nextIncrementAt &&
          now >= canary.nextIncrementAt.getTime()
        ) {
          const newPercentage = Math.min(
            canary.trafficPercentage + canary.incrementStep,
            canary.maxTraffic
          );

          canary.trafficPercentage = newPercentage;
          canary.nextIncrementAt = new Date(now + canary.incrementInterval);

          logger.info('Canary traffic auto-incremented', {
            canaryId: canary.id,
            newPercentage,
          });
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Track version route
   */
  private trackVersionRoute(version: string): void {
    const count = this.stats.routedByVersion.get(version) || 0;
    this.stats.routedByVersion.set(version, count + 1);
  }

  /**
   * Track rule route
   */
  private trackRuleRoute(routeId: string): void {
    const count = this.stats.routedByRule.get(routeId) || 0;
    this.stats.routedByRule.set(routeId, count + 1);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all routes
   */
  getAllRoutes(): TrafficRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get all canaries
   */
  getAllCanaries(): CanaryDeployment[] {
    return Array.from(this.canaries.values());
  }

  /**
   * Get statistics
   */
  getStats(): any {
    return {
      totalRequests: this.stats.totalRequests,
      routedByVersion: Object.fromEntries(this.stats.routedByVersion),
      routedByRule: Object.fromEntries(this.stats.routedByRule),
      canaryDeployments: this.stats.canaryDeployments,
      activeCanaries: this.stats.activeCanaries,
      failedRoutes: this.stats.failedRoutes,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      routedByVersion: new Map(),
      routedByRule: new Map(),
      canaryDeployments: this.stats.canaryDeployments,
      activeCanaries: this.stats.activeCanaries,
      failedRoutes: 0,
    };
    logger.info('Traffic router statistics reset');
  }
}

export const trafficRouter = new TrafficRouterService();
