/**
 * Smart Recommendations Controller
 */

import { Request, Response } from 'express';
import * as recommendationsService from '../services/recommendations.service.js';
import logger from '../utils/logger.js';

/**
 * Get personalized recommendations
 * GET /api/recommendations?type=hotels&limit=10
 */
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { type, limit } = req.query;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const recommendations = await recommendationsService.getRecommendations({
      userId,
      type: type as any,
      limit: limit ? parseInt(limit as string) : 10,
    });

    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get similar hotels
 * GET /api/recommendations/similar/hotels/:hotelId
 */
export const getSimilarHotels = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { limit } = req.query;

    const similar = await recommendationsService.getSimilarHotels(
      hotelId,
      limit ? parseInt(limit as string) : 5
    );

    res.json({ success: true, data: similar });
  } catch (error: any) {
    logger.error('Error getting similar hotels:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get "customers also booked"
 * GET /api/recommendations/also-booked/:bookingId
 */
export const getCustomersAlsoBooked = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { limit } = req.query;

    const recommendations = await recommendationsService.getCustomersAlsoBooked(
      bookingId,
      limit ? parseInt(limit as string) : 5
    );

    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    logger.error('Error getting also-booked recommendations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getRecommendations,
  getSimilarHotels,
  getCustomersAlsoBooked,
};
