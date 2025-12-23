/**
 * Gateway Controller
 * Handles gateway management and monitoring endpoints
 */

import { Request, Response } from 'express';
import { gatewayService } from '../gateway/gateway.service.js';
import logger from '../utils/logger.js';

/**
 * @route   GET /api/gateway/stats
 * @desc    Get gateway statistics
 * @access  Admin
 */
export const getGatewayStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = gatewayService.getStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Get gateway stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve gateway statistics',
    });
  }
};

/**
 * @route   POST /api/gateway/stats/reset
 * @desc    Reset gateway statistics
 * @access  Admin
 */
export const resetGatewayStats = async (req: Request, res: Response): Promise<void> => {
  try {
    gatewayService.resetStats();

    res.status(200).json({
      success: true,
      message: 'Gateway statistics reset successfully',
    });
  } catch (error: any) {
    logger.error('Reset gateway stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset gateway statistics',
    });
  }
};

/**
 * @route   GET /api/gateway/services
 * @desc    Get all registered services
 * @access  Admin
 */
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const services = gatewayService.getServices();

    res.status(200).json({
      success: true,
      data: services,
      count: services.length,
    });
  } catch (error: any) {
    logger.error('Get services error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve services',
    });
  }
};

/**
 * @route   GET /api/gateway/routes
 * @desc    Get all registered routes
 * @access  Admin
 */
export const getRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const routes = gatewayService.getRoutes();

    res.status(200).json({
      success: true,
      data: routes,
      count: routes.length,
    });
  } catch (error: any) {
    logger.error('Get routes error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve routes',
    });
  }
};

/**
 * @route   POST /api/gateway/services
 * @desc    Register a new service
 * @access  Admin
 */
export const registerService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, baseUrl, version, priority, timeout, retries } = req.body;

    // Validation
    if (!name || !baseUrl || !version) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, baseUrl, version',
      });
      return;
    }

    gatewayService.registerService({
      name,
      baseUrl,
      version,
      healthy: true,
      priority: priority || 1,
      timeout: timeout || 10000,
      retries: retries || 2,
    });

    res.status(201).json({
      success: true,
      message: 'Service registered successfully',
      service: { name, baseUrl, version },
    });
  } catch (error: any) {
    logger.error('Register service error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to register service',
    });
  }
};

/**
 * @route   POST /api/gateway/routes
 * @desc    Register a new route
 * @access  Admin
 */
export const registerRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path, method, service, targetPath, cacheTTL, timeout, aggregation, transformation, requiresAuth } = req.body;

    // Validation
    if (!path || !method || !service) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: path, method, service',
      });
      return;
    }

    gatewayService.registerRoute({
      path,
      method: method.toUpperCase(),
      service,
      targetPath,
      cacheTTL,
      timeout,
      aggregation,
      transformation,
      requiresAuth,
    });

    res.status(201).json({
      success: true,
      message: 'Route registered successfully',
      route: { path, method, service },
    });
  } catch (error: any) {
    logger.error('Register route error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to register route',
    });
  }
};
