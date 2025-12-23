/**
 * Metrics Controller
 * Expose metrics endpoints
 */

import { Request, Response } from 'express';
import { metricsService } from '../services/metrics.service.js';
import logger from '../utils/logger.js';

/**
 * @route   GET /metrics
 * @desc    Get Prometheus metrics
 * @access  Public (should be restricted in production)
 */
export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await metricsService.getMetrics();
    res.set('Content-Type', metricsService.getContentType());
    res.status(200).send(metrics);
  } catch (error: any) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
    });
  }
};

/**
 * @route   GET /metrics/summary
 * @desc    Get metrics summary (JSON format)
 * @access  Admin
 */
export const getMetricsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await metricsService.getMetricsSummary();
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    logger.error('Error getting metrics summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics summary',
    });
  }
};

/**
 * @route   POST /metrics/reset
 * @desc    Reset all metrics
 * @access  Admin
 */
export const resetMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    metricsService.resetMetrics();
    res.status(200).json({
      success: true,
      message: 'Metrics reset successfully',
    });
  } catch (error: any) {
    logger.error('Error resetting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics',
    });
  }
};
