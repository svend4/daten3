/**
 * Group Bookings Controller
 */

import { Request, Response } from 'express';
import * as groupBookingsService from '../services/groupBookings.service.js';
import logger from '../utils/logger.js';

/**
 * Create group booking
 * POST /api/group-bookings
 */
export const createGroupBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const groupBooking = await groupBookingsService.createGroupBooking(userId, req.body);
    res.json({ success: true, data: groupBooking });
  } catch (error: any) {
    logger.error('Error creating group booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get group booking
 * GET /api/group-bookings/:id
 */
export const getGroupBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const groupBooking = await groupBookingsService.getGroupBooking(id);
    res.json({ success: true, data: groupBooking });
  } catch (error: any) {
    logger.error('Error getting group booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Add participant
 * POST /api/group-bookings/:id/participants
 */
export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const participant = await groupBookingsService.addParticipant(id, req.body);
    res.json({ success: true, data: participant });
  } catch (error: any) {
    logger.error('Error adding participant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Process split payment
 * POST /api/group-bookings/:id/pay
 */
export const processSplitPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { participantId, paymentMethod } = req.body;

    const payment = await groupBookingsService.processSplitPayment(
      id,
      participantId,
      paymentMethod
    );
    res.json({ success: true, data: payment });
  } catch (error: any) {
    logger.error('Error processing split payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get group booking summary
 * GET /api/group-bookings/:id/summary
 */
export const getGroupBookingSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const summary = await groupBookingsService.getGroupBookingSummary(id);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    logger.error('Error getting group booking summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  createGroupBooking,
  getGroupBooking,
  addParticipant,
  processSplitPayment,
  getGroupBookingSummary,
};
