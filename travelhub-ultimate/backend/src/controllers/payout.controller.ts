/**
 * Payout Processing Controller
 * Handles affiliate payout requests and processing
 */

import { Request, Response } from 'express';
import * as payoutService from '../services/payout.service.js';
import logger from '../utils/logger.js';

/**
 * Request payout
 * POST /api/payouts/request
 */
export const requestPayout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { amount, paymentMethod, paymentDetails } = req.body;

    const payout = await payoutService.requestPayout(userId, {
      amount,
      paymentMethod,
      paymentDetails,
    });

    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error('Error requesting payout:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get user's payouts
 * GET /api/payouts
 */
export const getUserPayouts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { status, limit } = req.query;

    const payouts = await payoutService.getUserPayouts(userId, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.json({ success: true, data: payouts });
  } catch (error: any) {
    logger.error('Error getting payouts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get payout by ID
 * GET /api/payouts/:id
 */
export const getPayoutById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const payout = await payoutService.getPayoutById(id);

    if (!payout) {
      return res.status(404).json({ success: false, error: 'Payout not found' });
    }

    // Check ownership
    if (payout.affiliateId !== userId && (req as any).user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error('Error getting payout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cancel payout (only pending)
 * POST /api/payouts/:id/cancel
 */
export const cancelPayout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const payout = await payoutService.cancelPayout(id, userId);

    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error('Error cancelling payout:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get available balance for payout
 * GET /api/payouts/balance
 */
export const getAvailableBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const balance = await payoutService.getAvailableBalance(userId);

    res.json({ success: true, data: balance });
  } catch (error: any) {
    logger.error('Error getting balance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Get all payouts
 * GET /api/admin/payouts
 */
export const getAllPayouts = async (req: Request, res: Response) => {
  try {
    const { status, affiliateId, limit, offset } = req.query;

    const result = await payoutService.getAllPayouts({
      status: status as string,
      affiliateId: affiliateId as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error getting all payouts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Approve payout
 * POST /api/admin/payouts/:id/approve
 */
export const approvePayout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?.id;

    const payout = await payoutService.approvePayout(id, adminId);

    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error('Error approving payout:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Reject payout
 * POST /api/admin/payouts/:id/reject
 */
export const rejectPayout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user?.id;

    const payout = await payoutService.rejectPayout(id, adminId, reason);

    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error('Error rejecting payout:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Process payout (execute payment)
 * POST /api/admin/payouts/:id/process
 */
export const processPayout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?.id;

    const payout = await payoutService.processPayout(id, adminId);

    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error('Error processing payout:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export default {
  requestPayout,
  getUserPayouts,
  getPayoutById,
  cancelPayout,
  getAvailableBalance,
  getAllPayouts,
  approvePayout,
  rejectPayout,
  processPayout,
};
