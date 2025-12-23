/**
 * Tenant Management Routes
 * Routes for managing tenants (organizations)
 */

import { Router } from 'express';
import {
  createTenant,
  getTenant,
  getCurrentTenantInfo,
  listTenants,
  updateTenant,
  deleteTenant,
  getTenantStats,
  checkTenantLimits,
  generateTenantApiKey,
} from '../controllers/tenant.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { requireTenant } from '../middleware/multiTenancy.middleware.js';

const router = Router();

/**
 * @route   GET /api/tenants/current
 * @desc    Get current tenant information (from request context)
 * @access  Private (requires tenant context)
 */
router.get('/current', authenticate, requireTenant, getCurrentTenantInfo);

/**
 * @route   POST /api/tenants
 * @desc    Create a new tenant
 * @access  Admin only
 */
router.post('/', authenticate, requireAdmin, createTenant);

/**
 * @route   GET /api/tenants
 * @desc    List all tenants
 * @access  Admin only
 */
router.get('/', authenticate, requireAdmin, listTenants);

/**
 * @route   GET /api/tenants/:id
 * @desc    Get tenant by ID
 * @access  Private
 */
router.get('/:id', authenticate, getTenant);

/**
 * @route   PATCH /api/tenants/:id
 * @desc    Update tenant
 * @access  Admin only
 */
router.patch('/:id', authenticate, requireAdmin, updateTenant);

/**
 * @route   DELETE /api/tenants/:id
 * @desc    Delete tenant (soft delete)
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deleteTenant);

/**
 * @route   GET /api/tenants/:id/stats
 * @desc    Get tenant statistics
 * @access  Private
 */
router.get('/:id/stats', authenticate, getTenantStats);

/**
 * @route   GET /api/tenants/:id/limits
 * @desc    Check tenant resource limits
 * @access  Private
 */
router.get('/:id/limits', authenticate, checkTenantLimits);

/**
 * @route   POST /api/tenants/:id/api-key
 * @desc    Generate API key for tenant
 * @access  Admin only
 */
router.post('/:id/api-key', authenticate, requireAdmin, generateTenantApiKey);

export default router;
