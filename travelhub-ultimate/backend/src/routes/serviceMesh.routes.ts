/**
 * Service Mesh Management Routes
 * Admin-only endpoints for service mesh management
 */

import { Router } from 'express';
import {
  getMeshStatus,
  updateMeshConfig,
  getMeshStats,
  resetMeshStats,
  getServices,
  registerService,
  deregisterService,
  getRetryPolicies,
  registerRetryPolicy,
  getTrafficRoutes,
  createTrafficRoute,
  deleteTrafficRoute,
  getCanaries,
  createCanary,
  promoteCanary,
  rollbackCanary,
  getCertificates,
  issueCertificate,
  getACLs,
  addACL,
} from '../controllers/serviceMesh.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// All service mesh routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ============================================
// CONTROL PLANE
// ============================================

/**
 * @route   GET /api/mesh/status
 * @desc    Get service mesh status
 * @access  Admin
 */
router.get('/status', getMeshStatus);

/**
 * @route   PUT /api/mesh/config
 * @desc    Update service mesh configuration
 * @access  Admin
 */
router.put('/config', updateMeshConfig);

/**
 * @route   GET /api/mesh/stats
 * @desc    Get comprehensive mesh statistics
 * @access  Admin
 */
router.get('/stats', getMeshStats);

/**
 * @route   POST /api/mesh/stats/reset
 * @desc    Reset all mesh statistics
 * @access  Admin
 */
router.post('/stats/reset', resetMeshStats);

// ============================================
// SERVICE REGISTRY
// ============================================

/**
 * @route   GET /api/mesh/services
 * @desc    Get all registered services
 * @access  Admin
 */
router.get('/services', getServices);

/**
 * @route   POST /api/mesh/services
 * @desc    Register a service instance
 * @access  Admin
 */
router.post('/services', registerService);

/**
 * @route   DELETE /api/mesh/services/:serviceName/:instanceId
 * @desc    Deregister a service instance
 * @access  Admin
 */
router.delete('/services/:serviceName/:instanceId', deregisterService);

// ============================================
// RETRY POLICIES
// ============================================

/**
 * @route   GET /api/mesh/retry-policies
 * @desc    Get all retry policies
 * @access  Admin
 */
router.get('/retry-policies', getRetryPolicies);

/**
 * @route   POST /api/mesh/retry-policies
 * @desc    Register a retry policy
 * @access  Admin
 */
router.post('/retry-policies', registerRetryPolicy);

// ============================================
// TRAFFIC ROUTING
// ============================================

/**
 * @route   GET /api/mesh/routes
 * @desc    Get all traffic routes
 * @access  Admin
 */
router.get('/routes', getTrafficRoutes);

/**
 * @route   POST /api/mesh/routes
 * @desc    Create traffic route
 * @access  Admin
 */
router.post('/routes', createTrafficRoute);

/**
 * @route   DELETE /api/mesh/routes/:routeId
 * @desc    Delete traffic route
 * @access  Admin
 */
router.delete('/routes/:routeId', deleteTrafficRoute);

/**
 * @route   GET /api/mesh/canaries
 * @desc    Get all canary deployments
 * @access  Admin
 */
router.get('/canaries', getCanaries);

/**
 * @route   POST /api/mesh/canaries
 * @desc    Create canary deployment
 * @access  Admin
 */
router.post('/canaries', createCanary);

/**
 * @route   POST /api/mesh/canaries/:canaryId/promote
 * @desc    Promote canary to stable
 * @access  Admin
 */
router.post('/canaries/:canaryId/promote', promoteCanary);

/**
 * @route   POST /api/mesh/canaries/:canaryId/rollback
 * @desc    Rollback canary deployment
 * @access  Admin
 */
router.post('/canaries/:canaryId/rollback', rollbackCanary);

// ============================================
// SERVICE AUTHENTICATION
// ============================================

/**
 * @route   GET /api/mesh/certificates
 * @desc    Get all service certificates
 * @access  Admin
 */
router.get('/certificates', getCertificates);

/**
 * @route   POST /api/mesh/certificates
 * @desc    Issue service certificate
 * @access  Admin
 */
router.post('/certificates', issueCertificate);

/**
 * @route   GET /api/mesh/acls
 * @desc    Get all ACL entries
 * @access  Admin
 */
router.get('/acls', getACLs);

/**
 * @route   POST /api/mesh/acls
 * @desc    Add ACL entry
 * @access  Admin
 */
router.post('/acls', addACL);

export default router;
