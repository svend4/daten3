/**
 * API Gateway Middleware
 * Intercepts requests and routes them through the gateway service
 */

import { Request, Response, NextFunction } from 'express';
import { gatewayService } from '../gateway/gateway.service.js';
import logger from '../utils/logger.js';

/**
 * Gateway middleware configuration
 */
export interface GatewayConfig {
  enabled: boolean;
  pathPrefix: string; // e.g., '/gateway'
  fallthrough: boolean; // If true, continue to next middleware on route not found
}

const defaultConfig: GatewayConfig = {
  enabled: process.env.GATEWAY_ENABLED === 'true',
  pathPrefix: '/gateway',
  fallthrough: true,
};

/**
 * Create gateway middleware
 */
export const createGatewayMiddleware = (config: Partial<GatewayConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if gateway is disabled
    if (!finalConfig.enabled) {
      return next();
    }

    // Check if path starts with gateway prefix
    if (!req.path.startsWith(finalConfig.pathPrefix)) {
      return next();
    }

    try {
      logger.debug('Gateway middleware processing request', {
        method: req.method,
        path: req.path,
        query: req.query,
      });

      // Execute request through gateway
      const result = await gatewayService.executeRequest(req, res);

      // Send response
      res.status(200).json({
        success: true,
        data: result,
        gateway: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Gateway middleware error', {
        error: error.message,
        path: req.path,
        method: req.method,
      });

      // If fallthrough is enabled and route not found, continue to next middleware
      if (finalConfig.fallthrough && error.message.includes('No route configured')) {
        return next();
      }

      // Send error response
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Gateway error',
        gateway: true,
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Default gateway middleware instance
 */
export const gatewayMiddleware = createGatewayMiddleware();
