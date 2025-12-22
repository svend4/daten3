import { Router } from 'express';
import {
  basicHealthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck
} from '../controllers/health.controller.js';

const router = Router();

/**
 * @route   GET /health
 * @desc    Basic health check - fast response
 * @access  Public
 */
router.get('/', basicHealthCheck);

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with dependency status
 * @access  Public
 */
router.get('/detailed', detailedHealthCheck);

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for orchestrators (K8s, Railway)
 * @access  Public
 */
router.get('/ready', readinessCheck);

/**
 * @route   GET /health/live
 * @desc    Liveness probe for orchestrators (K8s, Railway)
 * @access  Public
 */
router.get('/live', livenessCheck);

export default router;
