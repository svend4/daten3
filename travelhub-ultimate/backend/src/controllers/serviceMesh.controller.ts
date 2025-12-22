/**
 * Service Mesh Controller
 * Management endpoints for service mesh features
 */

import { Request, Response } from 'express';
import { serviceMesh } from '../mesh/controlPlane.js';
import { serviceRegistry, LoadBalancingStrategy } from '../mesh/serviceRegistry.js';
import { retryPolicyService } from '../mesh/retryPolicy.js';
import { trafficRouter } from '../mesh/trafficRouter.js';
import { serviceAuth } from '../mesh/serviceAuth.js';
import logger from '../utils/logger.js';

// ============================================
// CONTROL PLANE
// ============================================

/**
 * @route   GET /api/mesh/status
 * @desc    Get service mesh status
 * @access  Admin
 */
export const getMeshStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = {
      ...serviceMesh.getHealth(),
      config: serviceMesh.getConfig(),
    };

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('Get mesh status error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve mesh status',
    });
  }
};

/**
 * @route   PUT /api/mesh/config
 * @desc    Update service mesh configuration
 * @access  Admin
 */
export const updateMeshConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    serviceMesh.updateConfig(updates);

    res.status(200).json({
      success: true,
      message: 'Service mesh configuration updated',
      config: serviceMesh.getConfig(),
    });
  } catch (error: any) {
    logger.error('Update mesh config error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update mesh configuration',
    });
  }
};

/**
 * @route   GET /api/mesh/stats
 * @desc    Get comprehensive mesh statistics
 * @access  Admin
 */
export const getMeshStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = serviceMesh.getStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Get mesh stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve mesh statistics',
    });
  }
};

/**
 * @route   POST /api/mesh/stats/reset
 * @desc    Reset all mesh statistics
 * @access  Admin
 */
export const resetMeshStats = async (req: Request, res: Response): Promise<void> => {
  try {
    serviceMesh.resetAllStats();

    res.status(200).json({
      success: true,
      message: 'Service mesh statistics reset successfully',
    });
  } catch (error: any) {
    logger.error('Reset mesh stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset mesh statistics',
    });
  }
};

// ============================================
// SERVICE REGISTRY
// ============================================

/**
 * @route   GET /api/mesh/services
 * @desc    Get all registered services
 * @access  Admin
 */
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const services = serviceRegistry.getAllServices();

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
 * @route   POST /api/mesh/services
 * @desc    Register a service instance
 * @access  Admin
 */
export const registerService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, version, host, port, protocol, weight, metadata, healthCheckUrl, tags } = req.body;

    if (!name || !version || !host || !port) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, version, host, port',
      });
      return;
    }

    const instance = serviceRegistry.register({
      name,
      version,
      host,
      port,
      protocol,
      weight,
      metadata,
      healthCheckUrl,
      tags,
    });

    res.status(201).json({
      success: true,
      message: 'Service registered successfully',
      data: instance,
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
 * @route   DELETE /api/mesh/services/:serviceName/:instanceId
 * @desc    Deregister a service instance
 * @access  Admin
 */
export const deregisterService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceName, instanceId } = req.params;

    const success = serviceRegistry.deregister(serviceName, instanceId);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Service instance not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Service deregistered successfully',
    });
  } catch (error: any) {
    logger.error('Deregister service error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to deregister service',
    });
  }
};

// ============================================
// RETRY POLICIES
// ============================================

/**
 * @route   GET /api/mesh/retry-policies
 * @desc    Get all retry policies
 * @access  Admin
 */
export const getRetryPolicies = async (req: Request, res: Response): Promise<void> => {
  try {
    const policies = retryPolicyService.getPolicies();

    res.status(200).json({
      success: true,
      data: policies,
      count: policies.length,
    });
  } catch (error: any) {
    logger.error('Get retry policies error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve retry policies',
    });
  }
};

/**
 * @route   POST /api/mesh/retry-policies
 * @desc    Register a retry policy
 * @access  Admin
 */
export const registerRetryPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { operation, config } = req.body;

    if (!operation) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: operation',
      });
      return;
    }

    retryPolicyService.registerPolicy(operation, config);

    res.status(201).json({
      success: true,
      message: 'Retry policy registered successfully',
      operation,
      config,
    });
  } catch (error: any) {
    logger.error('Register retry policy error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to register retry policy',
    });
  }
};

// ============================================
// TRAFFIC ROUTING
// ============================================

/**
 * @route   GET /api/mesh/routes
 * @desc    Get all traffic routes
 * @access  Admin
 */
export const getTrafficRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const routes = trafficRouter.getAllRoutes();

    res.status(200).json({
      success: true,
      data: routes,
      count: routes.length,
    });
  } catch (error: any) {
    logger.error('Get traffic routes error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve traffic routes',
    });
  }
};

/**
 * @route   POST /api/mesh/routes
 * @desc    Create traffic route
 * @access  Admin
 */
export const createTrafficRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, serviceName, enabled, rules } = req.body;

    if (!name || !serviceName || !rules) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, serviceName, rules',
      });
      return;
    }

    const route = trafficRouter.createRoute({ name, serviceName, enabled, rules });

    res.status(201).json({
      success: true,
      message: 'Traffic route created successfully',
      data: route,
    });
  } catch (error: any) {
    logger.error('Create traffic route error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create traffic route',
    });
  }
};

/**
 * @route   DELETE /api/mesh/routes/:routeId
 * @desc    Delete traffic route
 * @access  Admin
 */
export const deleteTrafficRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { routeId } = req.params;

    const success = trafficRouter.deleteRoute(routeId);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Traffic route not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Traffic route deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete traffic route error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete traffic route',
    });
  }
};

/**
 * @route   GET /api/mesh/canaries
 * @desc    Get all canary deployments
 * @access  Admin
 */
export const getCanaries = async (req: Request, res: Response): Promise<void> => {
  try {
    const canaries = trafficRouter.getAllCanaries();

    res.status(200).json({
      success: true,
      data: canaries,
      count: canaries.length,
    });
  } catch (error: any) {
    logger.error('Get canaries error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve canary deployments',
    });
  }
};

/**
 * @route   POST /api/mesh/canaries
 * @desc    Create canary deployment
 * @access  Admin
 */
export const createCanary = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = req.body;

    if (!config.serviceName || !config.canaryVersion || !config.stableVersion) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: serviceName, canaryVersion, stableVersion',
      });
      return;
    }

    const canary = trafficRouter.createCanary(config);

    res.status(201).json({
      success: true,
      message: 'Canary deployment created successfully',
      data: canary,
    });
  } catch (error: any) {
    logger.error('Create canary error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create canary deployment',
    });
  }
};

/**
 * @route   POST /api/mesh/canaries/:canaryId/promote
 * @desc    Promote canary to stable
 * @access  Admin
 */
export const promoteCanary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { canaryId } = req.params;

    const success = trafficRouter.promoteCanary(canaryId);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Canary deployment not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Canary promoted to stable successfully',
    });
  } catch (error: any) {
    logger.error('Promote canary error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to promote canary',
    });
  }
};

/**
 * @route   POST /api/mesh/canaries/:canaryId/rollback
 * @desc    Rollback canary deployment
 * @access  Admin
 */
export const rollbackCanary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { canaryId } = req.params;

    const success = trafficRouter.rollbackCanary(canaryId);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Canary deployment not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Canary rolled back successfully',
    });
  } catch (error: any) {
    logger.error('Rollback canary error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to rollback canary',
    });
  }
};

// ============================================
// SERVICE AUTHENTICATION
// ============================================

/**
 * @route   GET /api/mesh/certificates
 * @desc    Get all service certificates
 * @access  Admin
 */
export const getCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const certificates = serviceAuth.getAllCertificates();

    res.status(200).json({
      success: true,
      data: certificates,
      count: certificates.length,
    });
  } catch (error: any) {
    logger.error('Get certificates error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve certificates',
    });
  }
};

/**
 * @route   POST /api/mesh/certificates
 * @desc    Issue service certificate
 * @access  Admin
 */
export const issueCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, serviceName } = req.body;

    if (!serviceId || !serviceName) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: serviceId, serviceName',
      });
      return;
    }

    const cert = serviceAuth.issueCertificate(serviceId, serviceName);

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: cert,
    });
  } catch (error: any) {
    logger.error('Issue certificate error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to issue certificate',
    });
  }
};

/**
 * @route   GET /api/mesh/acls
 * @desc    Get all ACL entries
 * @access  Admin
 */
export const getACLs = async (req: Request, res: Response): Promise<void> => {
  try {
    const acls = serviceAuth.getAllACLs();

    res.status(200).json({
      success: true,
      data: acls,
      count: acls.length,
    });
  } catch (error: any) {
    logger.error('Get ACLs error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve ACLs',
    });
  }
};

/**
 * @route   POST /api/mesh/acls
 * @desc    Add ACL entry
 * @access  Admin
 */
export const addACL = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceService, targetService, allowed, permissions } = req.body;

    if (!sourceService || !targetService) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceService, targetService',
      });
      return;
    }

    serviceAuth.addACL({
      sourceService,
      targetService,
      allowed: allowed !== false,
      permissions: permissions || [],
    });

    res.status(201).json({
      success: true,
      message: 'ACL entry added successfully',
    });
  } catch (error: any) {
    logger.error('Add ACL error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to add ACL entry',
    });
  }
};
