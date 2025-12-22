/**
 * Payout Processing Service
 * Handles affiliate payout requests, approvals, and processing
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { commissionService } from './commission.service.js';

const prisma = new PrismaClient();

export interface PayoutRequest {
  amount: number;
  paymentMethod: 'paypal' | 'bank_transfer' | 'crypto';
  paymentDetails: any;
}

export interface PayoutFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Request a new payout
 */
export async function requestPayout(
  userId: string,
  request: PayoutRequest
): Promise<any> {
  try {
    logger.info(`Payout request from user ${userId} for $${request.amount}`);

    // Get affiliate profile
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new Error('Affiliate profile not found');
    }

    // Check available balance
    const balance = await getAvailableBalance(userId);

    if (balance.available < request.amount) {
      throw new Error(`Insufficient balance. Available: $${balance.available}`);
    }

    // Check minimum payout amount ($50)
    const MIN_PAYOUT = 50;
    if (request.amount < MIN_PAYOUT) {
      throw new Error(`Minimum payout amount is $${MIN_PAYOUT}`);
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        affiliateId: affiliate.id,
        amount: request.amount,
        currency: 'USD',
        paymentMethod: request.paymentMethod,
        paymentDetails: request.paymentDetails,
        status: 'pending',
      },
    });

    logger.info(`Payout created: ${payout.id}`);

    // TODO: Send notification to affiliate
    // TODO: Send notification to admin

    return payout;
  } catch (error: any) {
    logger.error('Error requesting payout:', error);
    throw error;
  }
}

/**
 * Get available balance for affiliate
 */
export async function getAvailableBalance(userId: string): Promise<{
  total: number;
  pending: number;
  approved: number;
  paid: number;
  available: number;
  pendingPayouts: number;
}> {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new Error('Affiliate profile not found');
    }

    // Get all commissions by status
    const commissions = await prisma.commission.findMany({
      where: { affiliateId: affiliate.id },
    });

    const pending = commissions
      .filter((c: any) => c.status === 'pending')
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    const approved = commissions
      .filter((c: any) => c.status === 'approved')
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    const paid = commissions
      .filter((c: any) => c.status === 'paid')
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    const total = pending + approved + paid;

    // Get pending payouts
    const pendingPayoutsSum = await prisma.payout.aggregate({
      where: {
        affiliateId: affiliate.id,
        status: { in: ['pending', 'processing', 'approved'] },
      },
      _sum: { amount: true },
    });

    const pendingPayouts = pendingPayoutsSum._sum.amount || 0;

    // Available = approved commissions - pending payouts
    const available = approved - pendingPayouts;

    return {
      total,
      pending,
      approved,
      paid,
      available: Math.max(0, available),
      pendingPayouts,
    };
  } catch (error: any) {
    logger.error('Error getting available balance:', error);
    throw error;
  }
}

/**
 * Get user's payouts
 */
export async function getUserPayouts(
  userId: string,
  filters: PayoutFilters = {}
): Promise<any[]> {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new Error('Affiliate profile not found');
    }

    const payouts = await prisma.payout.findMany({
      where: {
        affiliateId: affiliate.id,
        ...(filters.status && { status: filters.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
    });

    return payouts;
  } catch (error: any) {
    logger.error('Error getting user payouts:', error);
    throw error;
  }
}

/**
 * Get payout by ID
 */
export async function getPayoutById(payoutId: string): Promise<any> {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return payout;
  } catch (error: any) {
    logger.error('Error getting payout by ID:', error);
    throw error;
  }
}

/**
 * Cancel payout (only pending)
 */
export async function cancelPayout(payoutId: string, userId: string): Promise<any> {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { affiliate: true },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.affiliate.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (payout.status !== 'pending') {
      throw new Error('Can only cancel pending payouts');
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'cancelled' },
    });

    logger.info(`Payout cancelled: ${payoutId}`);

    return updatedPayout;
  } catch (error: any) {
    logger.error('Error cancelling payout:', error);
    throw error;
  }
}

/**
 * Admin: Get all payouts
 */
export async function getAllPayouts(filters: {
  status?: string;
  affiliateId?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  payouts: any[];
  total: number;
  stats: {
    pending: number;
    approved: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
}> {
  try {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.affiliateId) {
      where.affiliateId = filters.affiliateId;
    }

    const [payouts, total, stats] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.payout.count({ where }),
      prisma.payout.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const statsMap: any = {
      pending: 0,
      approved: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    stats.forEach((s: any) => {
      statsMap[s.status] = s._count.status;
    });

    return {
      payouts,
      total,
      stats: statsMap,
    };
  } catch (error: any) {
    logger.error('Error getting all payouts:', error);
    throw error;
  }
}

/**
 * Admin: Approve payout
 */
export async function approvePayout(payoutId: string, adminId: string): Promise<any> {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'pending') {
      throw new Error('Can only approve pending payouts');
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    });

    logger.info(`Payout approved: ${payoutId} by admin ${adminId}`);

    // TODO: Send notification to affiliate

    return updatedPayout;
  } catch (error: any) {
    logger.error('Error approving payout:', error);
    throw error;
  }
}

/**
 * Admin: Reject payout
 */
export async function rejectPayout(
  payoutId: string,
  adminId: string,
  reason?: string
): Promise<any> {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'pending') {
      throw new Error('Can only reject pending payouts');
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'failed',
        processedAt: new Date(),
        notes: reason,
      },
    });

    logger.info(`Payout rejected: ${payoutId} by admin ${adminId}. Reason: ${reason}`);

    // TODO: Send notification to affiliate

    return updatedPayout;
  } catch (error: any) {
    logger.error('Error rejecting payout:', error);
    throw error;
  }
}

/**
 * Admin: Process payout (execute payment)
 */
export async function processPayout(payoutId: string, adminId: string): Promise<any> {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { affiliate: true },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'approved') {
      throw new Error('Can only process approved payouts');
    }

    // Update status to processing
    await prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'processing', processedAt: new Date() },
    });

    // TODO: Integrate with payment provider based on paymentMethod
    // - PayPal: Use PayPal Payouts API
    // - Bank Transfer: Generate ACH/Wire transfer
    // - Crypto: Send crypto transaction

    // Simulate payment processing
    const transactionId = `TXN-${Date.now()}`;

    // Use existing commission service to mark commissions as paid
    await commissionService.processPayout(payoutId);

    // Update payout status to completed
    const completedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        transactionId,
      },
    });

    logger.info(`Payout processed: ${payoutId}, transaction: ${transactionId}`);

    // TODO: Send confirmation email to affiliate

    return completedPayout;
  } catch (error: any) {
    logger.error('Error processing payout:', error);

    // Mark as failed
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'failed',
        notes: error.message,
      },
    });

    throw error;
  }
}

export default {
  requestPayout,
  getAvailableBalance,
  getUserPayouts,
  getPayoutById,
  cancelPayout,
  getAllPayouts,
  approvePayout,
  rejectPayout,
  processPayout,
};
