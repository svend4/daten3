/**
 * Tenant Management Controller
 * Controllers for tenant CRUD operations
 */

import { Request, Response } from 'express';
import { tenantService, CreateTenantData, UpdateTenantData } from '../services/tenant.service.js';
import { getCurrentTenant, getCurrentTenantId } from '../middleware/multiTenancy.middleware.js';
import logger from '../utils/logger.js';

/**
 * Create a new tenant
 * POST /api/tenants
 * Admin only
 */
export const createTenant = async (req: Request, res: Response) => {
  try {
    const data: CreateTenantData = req.body;

    // Validate required fields
    if (!data.name || !data.slug) {
      return res.status(400).json({
        success: false,
        error: 'Name and slug are required',
      });
    }

    // Create tenant
    const tenant = await tenantService.createTenant(data);

    logger.info('Tenant created', {
      tenantId: tenant.id,
      slug: tenant.slug,
      adminId: (req as any).user?.id,
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      tenant,
    });
  } catch (error: any) {
    logger.error('Error creating tenant:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tenant',
    });
  }
};

/**
 * Get tenant by ID
 * GET /api/tenants/:id
 */
export const getTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tenant = await tenantService.getTenantById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found',
      });
    }

    // Get statistics
    const stats = await tenantService.getTenantStats(id);

    res.status(200).json({
      success: true,
      tenant: {
        ...tenant,
        stats,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant',
    });
  }
};

/**
 * Get current tenant (from request context)
 * GET /api/tenants/current
 */
export const getCurrentTenantInfo = async (req: Request, res: Response) => {
  try {
    const tenant = getCurrentTenant(req);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'No tenant context found',
      });
    }

    // Get statistics
    const stats = await tenantService.getTenantStats(tenant.id);
    const limits = await tenantService.checkLimits(tenant.id);

    res.status(200).json({
      success: true,
      tenant: {
        ...tenant,
        stats,
        limits,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching current tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant information',
    });
  }
};

/**
 * List all tenants
 * GET /api/tenants
 * Admin only
 */
export const listTenants = async (req: Request, res: Response) => {
  try {
    const options = {
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
      plan: req.query.plan as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await tenantService.listTenants(options);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.error('Error listing tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list tenants',
    });
  }
};

/**
 * Update tenant
 * PATCH /api/tenants/:id
 * Admin only
 */
export const updateTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateTenantData = req.body;

    const tenant = await tenantService.updateTenant(id, data);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found',
      });
    }

    logger.info('Tenant updated', {
      tenantId: id,
      updates: Object.keys(data),
      adminId: (req as any).user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      tenant,
    });
  } catch (error: any) {
    logger.error('Error updating tenant:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tenant',
    });
  }
};

/**
 * Delete tenant (soft delete)
 * DELETE /api/tenants/:id
 * Admin only
 */
export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await tenantService.deleteTenant(id);

    logger.info('Tenant deleted', {
      tenantId: id,
      adminId: (req as any).user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting tenant:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete tenant',
    });
  }
};

/**
 * Get tenant statistics
 * GET /api/tenants/:id/stats
 */
export const getTenantStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stats = await tenantService.getTenantStats(id);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching tenant stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant statistics',
    });
  }
};

/**
 * Check tenant limits
 * GET /api/tenants/:id/limits
 */
export const checkTenantLimits = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const limits = await tenantService.checkLimits(id);

    res.status(200).json({
      success: true,
      limits,
    });
  } catch (error: any) {
    logger.error('Error checking tenant limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check tenant limits',
    });
  }
};

/**
 * Generate tenant API key
 * POST /api/tenants/:id/api-key
 * Admin only
 */
export const generateTenantApiKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const apiKey = await tenantService.generateApiKey(id);

    logger.info('API key generated for tenant', {
      tenantId: id,
      adminId: (req as any).user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'API key generated successfully',
      apiKey,
    });
  } catch (error: any) {
    logger.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key',
    });
  }
};
