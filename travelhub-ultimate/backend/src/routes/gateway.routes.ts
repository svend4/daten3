/**
 * Gateway Management Routes
 * Routes for managing API Gateway configuration
 */

import { Router } from 'express';
import {
  getGatewayStats,
  resetGatewayStats,
  getServices,
  getRoutes,
  registerService,
  registerRoute,
} from '../controllers/gateway.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// All gateway management routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/gateway/stats
 * @desc    Get gateway statistics
 * @access  Admin
 */
router.get('/stats', getGatewayStats);

/**
 * @route   POST /api/gateway/stats/reset
 * @desc    Reset gateway statistics
 * @access  Admin
 */
router.post('/stats/reset', resetGatewayStats);

/**
 * @route   GET /api/gateway/services
 * @desc    Get all registered services
 * @access  Admin
 */
router.get('/services', getServices);

/**
 * @route   POST /api/gateway/services
 * @desc    Register a new service
 * @access  Admin
 */
router.post('/services', registerService);

/**
 * @route   GET /api/gateway/routes
 * @desc    Get all registered routes
 * @access  Admin
 */
router.get('/routes', getRoutes);

/**
 * @route   POST /api/gateway/routes
 * @desc    Register a new route
 * @access  Admin
 */
router.post('/routes', registerRoute);

export default router;
