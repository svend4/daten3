/**
 * Loyalty Program Controller
 */

import { Request, Response } from 'express';
import * as loyaltyService from '../services/loyalty.service.js';
import logger from '../utils/logger.js';

/**
 * Get loyalty member profile
 * GET /api/loyalty/member
 */
export const getMemberProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const member = await loyaltyService.getLoyaltyMember(userId);
    res.json({ success: true, data: member });
  } catch (error: any) {
    logger.error('Error getting loyalty member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get available rewards
 * GET /api/loyalty/rewards
 */
export const getRewards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const rewards = await loyaltyService.getAvailableRewards(userId);
    res.json({ success: true, data: rewards });
  } catch (error: any) {
    logger.error('Error getting rewards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Redeem points for reward
 * POST /api/loyalty/redeem
 */
export const redeemReward = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { rewardId } = req.body;
    const result = await loyaltyService.redeemPoints(userId, rewardId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error redeeming reward:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get points history
 * GET /api/loyalty/history
 */
export const getPointsHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { limit } = req.query;
    const history = await loyaltyService.getPointsHistory(
      userId,
      limit ? parseInt(limit as string) : 50
    );
    res.json({ success: true, data: history });
  } catch (error: any) {
    logger.error('Error getting points history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getMemberProfile,
  getRewards,
  redeemReward,
  getPointsHistory,
};
