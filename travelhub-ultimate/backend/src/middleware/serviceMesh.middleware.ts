/**
 * Service Mesh Middleware
 * Tracks service calls and integrates with control plane
 */

import { Request, Response, NextFunction } from 'express';
import { serviceMesh } from '../mesh/controlPlane.js';
import logger from '../utils/logger.js';

/**
 * Service mesh configuration for middleware
 */
export interface ServiceMeshMiddlewareConfig {
  enabled: boolean;
  trackRequests: boolean;
  serviceId: string; // ID of this service instance
}

const defaultConfig: ServiceMeshMiddlewareConfig = {
  enabled: process.env.SERVICE_MESH_ENABLED === 'true',
  trackRequests: true,
  serviceId: process.env.SERVICE_ID || 'travelhub-api',
};

/**
 * Middleware statistics
 */
interface MiddlewareStats {
  requestsTracked: number;
  meshCalls: number;
  meshCallsFailed: number;
}

const stats: MiddlewareStats = {
  requestsTracked: 0,
  meshCalls: 0,
  meshCallsFailed: 0,
};

/**
 * Create service mesh middleware
 */
export const createServiceMeshMiddleware = (config: Partial<ServiceMeshMiddlewareConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };

  return (req: Request, res: Response, next: NextFunction) => {
    if (!finalConfig.enabled || !finalConfig.trackRequests) {
      return next();
    }

    // Attach service mesh helper to request
    (req as any).serviceMesh = {
      serviceId: finalConfig.serviceId,
      call: async <T>(targetService: string, fn: () => Promise<T>, options: any = {}) => {
        try {
          stats.meshCalls++;
          return await serviceMesh.call(finalConfig.serviceId, {
            targetService,
            routingContext: {
              headers: req.headers as Record<string, string>,
              userId: (req as any).user?.id,
              userRole: (req as any).user?.role,
            },
            ...options,
          }, fn);
        } catch (error: any) {
          stats.meshCallsFailed++;
          throw error;
        }
      },
    };

    stats.requestsTracked++;
    next();
  };
};

/**
 * Default service mesh middleware instance
 */
export const serviceMeshMiddleware = createServiceMeshMiddleware();

/**
 * Get middleware statistics
 */
export const getServiceMeshMiddlewareStats = () => {
  return {
    ...stats,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Reset middleware statistics
 */
export const resetServiceMeshMiddlewareStats = () => {
  stats.requestsTracked = 0;
  stats.meshCalls = 0;
  stats.meshCallsFailed = 0;
  logger.info('Service mesh middleware statistics reset');
};
