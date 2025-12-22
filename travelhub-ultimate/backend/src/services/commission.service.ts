/**
 * Commission Service
 * Automated commission distribution for affiliate program
 * Handles multi-level referral tracking and payouts
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Booking data for commission processing
 */
interface BookingData {
  userId: string;
  bookingId: string;
  bookingType: string;
  bookingAmount: number;
  currency: string;
  referralCode?: string; // From cookie or parameter
}

/**
 * Commission Service Class
 * Handles affiliate commission calculations and distributions
 */
class CommissionService {
  /**
   * Process conversion (booking) and distribute commissions
   * TODO: Requires AffiliateConversion model to be added to Prisma schema
   */
  async processConversion(bookingData: BookingData): Promise<any> {
    logger.warn('processConversion is not implemented - requires AffiliateConversion model');
    return null;

    /* TODO: Uncomment when AffiliateConversion model is added to schema
    try {
      const {
        userId,
        bookingId,
        bookingType,
        bookingAmount,
        currency,
        referralCode
      } = bookingData;

      // Find affiliate who referred the customer
      if (!referralCode) {
        logger.info('No referral code for booking', { bookingId });
        return null;
      }

      const sourceAffiliate = await prisma.affiliate.findUnique({
        where: { referralCode }
      });

      if (!sourceAffiliate || sourceAffiliate.status !== 'active') {
        logger.warn('Invalid or inactive affiliate', { referralCode });
        return null;
      }

      // Create conversion
      const conversion = await prisma.affiliateConversion.create({
        data: {
          affiliateId: sourceAffiliate.id,
          bookingId,
          bookingType,
          bookingAmount,
          currency,
          commissionRate: 0, // Will be calculated
          commissionAmount: 0, // Will be calculated
          status: 'pending'
        }
      });

      logger.info('Conversion created', {
        conversionId: conversion.id,
        affiliateId: sourceAffiliate.id,
        bookingId
      });

      // Distribute commissions through the referral chain
      await this.distributeCommissions(sourceAffiliate, conversion, bookingAmount);

      // Mark click as converted
      await prisma.affiliateClick.updateMany({
        where: {
          affiliateId: sourceAffiliate.id,
          converted: false,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        data: {
          converted: true
        }
      });

      return conversion;
    } catch (error: any) {
      logger.error('Process conversion error:', error);
      throw error;
    }
    */
  }

  /**
   * Distribute commissions through the referral chain
   * TODO: Requires AffiliateSettings and AffiliateConversion models to be added to Prisma schema
   */
  async distributeCommissions(
    affiliate: any,
    conversion: any,
    bookingAmount: number
  ): Promise<any[]> {
    logger.warn('distributeCommissions is not implemented - requires AffiliateSettings model');
    return [];

    /* TODO: Uncomment when AffiliateSettings and AffiliateConversion models are added
    try {
      // Get commission settings
      const settings = await prisma.affiliateSettings.findFirst();

      if (!settings) {
        throw new Error('Affiliate settings not found');
      }

      const rates = [
        settings.level1Rate,
        settings.level2Rate,
        settings.level3Rate
      ];

      const maxLevels = Math.min(settings.maxLevels, rates.length);

      // Traverse referral chain
      let currentAffiliate = affiliate;
      let level = 1;
      const commissions: any[] = [];

      while (currentAffiliate && level <= maxLevels) {
        const rate = rates[level - 1];
        const commissionAmount = (bookingAmount * rate) / 100;

        // Create commission (Note: conversionId field does not exist in Commission model)
        const commission = await prisma.commission.create({
          data: {
            affiliateId: currentAffiliate.id,
            type: 'booking',
            amount: commissionAmount,
            currency: conversion.currency,
            status: settings.autoApprove ? 'approved' : 'pending'
          }
        });

        commissions.push(commission);

        logger.info('Commission created', {
          commissionId: commission.id,
          affiliateId: currentAffiliate.id,
          level,
          amount: commissionAmount
        });

        // Update affiliate total earnings
        await prisma.affiliate.update({
          where: { id: currentAffiliate.id },
          data: {
            totalEarnings: {
              increment: commissionAmount
            }
          }
        });

        // Move to parent affiliate
        if (currentAffiliate.referredBy) {
          currentAffiliate = await prisma.affiliate.findUnique({
            where: { id: currentAffiliate.referredBy }
          });
          level++;
        } else {
          break;
        }
      }

      // Update conversion
      const totalCommission = commissions.reduce((sum: number, c: any) => sum + c.amount, 0);
      const averageRate = (totalCommission / bookingAmount) * 100;

      await prisma.affiliateConversion.update({
        where: { id: conversion.id },
        data: {
          commissionRate: averageRate,
          commissionAmount: totalCommission
        }
      });

      logger.info('Commissions distributed', {
        conversionId: conversion.id,
        levels: commissions.length,
        totalCommission
      });

      return commissions;
    } catch (error: any) {
      logger.error('Distribute commissions error:', error);
      throw error;
    }
    */
  }

  /**
   * Approve commission (after holding period)
   */
  async approveCommission(commissionId: string): Promise<any> {
    try {
      const commission = await prisma.commission.update({
        where: { id: commissionId },
        data: {
          status: 'approved',
          approvedAt: new Date()
        }
      });

      logger.info('Commission approved', { commissionId });

      return commission;
    } catch (error: any) {
      logger.error('Approve commission error:', error);
      throw error;
    }
  }

  /**
   * Auto-approve commissions after holding period
   * Should be called by cron job
   * TODO: Requires AffiliateSettings model to be added to Prisma schema
   */
  async autoApproveCommissions(): Promise<number> {
    logger.warn('autoApproveCommissions is not implemented - requires AffiliateSettings model');
    return 0;

    /* TODO: Uncomment when AffiliateSettings model is added
    try {
      const settings = await prisma.affiliateSettings.findFirst();

      if (!settings) {
        throw new Error('Affiliate settings not found');
      }

      const holdDate = new Date();
      holdDate.setDate(holdDate.getDate() - settings.commissionHoldDays);

      // Find commissions to approve
      const commissionsToApprove = await prisma.commission.findMany({
        where: {
          status: 'pending',
          createdAt: {
            lte: holdDate
          }
        }
      });

      logger.info(`Auto-approving ${commissionsToApprove.length} commissions`);

      // Approve each
      for (const commission of commissionsToApprove) {
        await this.approveCommission(commission.id);
      }

      return commissionsToApprove.length;
    } catch (error: any) {
      logger.error('Auto approve commissions error:', error);
      throw error;
    }
    */
  }

  /**
   * Process payout
   */
  async processPayout(payoutId: string): Promise<any> {
    try {
      const payout = await prisma.payout.findUnique({
        where: { id: payoutId },
        include: {
          affiliate: true
        }
      });

      if (!payout) {
        throw new Error('Payout not found');
      }

      if (payout.status !== 'pending') {
        throw new Error('Payout already processed');
      }

      // Update status
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'processing',
          processedAt: new Date()
        }
      });

      // TODO: Integration with payment system
      // PayPal, Stripe, Bank Transfer, etc.
      // For now, simulate successful payout

      // Find approved commissions for this payout
      const commissionsForPayout = await prisma.commission.findMany({
        where: {
          affiliateId: payout.affiliateId,
          status: 'approved'
        },
        orderBy: {
          approvedAt: 'asc'
        }
      });

      // Mark commissions as paid
      let remainingAmount = payout.amount;
      const paidCommissionIds: string[] = [];

      for (const commission of commissionsForPayout) {
        if (remainingAmount <= 0) break;

        if (commission.amount <= remainingAmount) {
          await prisma.commission.update({
            where: { id: commission.id },
            data: {
              status: 'paid',
              paidAt: new Date()
            }
          });

          paidCommissionIds.push(commission.id);
          remainingAmount -= commission.amount;
        }
      }

      // Complete payout
      const completedPayout = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          transactionId: `TXN-${Date.now()}` // In reality - ID from payment system
        }
      });

      logger.info('Payout processed', {
        payoutId,
        affiliateId: payout.affiliateId,
        amount: payout.amount,
        commissionsPaid: paidCommissionIds.length
      });

      return completedPayout;
    } catch (error: any) {
      logger.error('Process payout error:', error);

      // Mark payout as failed
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'failed'
        }
      });

      throw error;
    }
  }

  /**
   * Calculate potential earnings for affiliate
   */
  async calculatePotentialEarnings(
    affiliateId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    pending: number;
    approved: number;
    paid: number;
    total: number;
  }> {
    try {
      const startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const commissions = await prisma.commission.findMany({
        where: {
          affiliateId,
          createdAt: {
            gte: startDate
          }
        }
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

      return {
        pending,
        approved,
        paid,
        total: pending + approved + paid
      };
    } catch (error: any) {
      logger.error('Calculate potential earnings error:', error);
      throw error;
    }
  }

  /**
   * Get commission statistics
   * TODO: Requires AffiliateConversion model to be added to Prisma schema
   */
  async getCommissionStats(affiliateId: string): Promise<{
    totalConversions: number;
    totalCommission: number;
    averageCommission: number;
    conversionRate: number;
  }> {
    try {
      // Get total clicks
      const totalClicks = await prisma.affiliateClick.count({
        where: { affiliateId }
      });

      // Get commissions (using commissions as proxy for conversions)
      const commissions = await prisma.commission.findMany({
        where: { affiliateId }
      });

      const totalConversions = commissions.length;
      const totalCommission = commissions.reduce((sum: number, c: any) => sum + c.amount, 0);
      const averageCommission = totalConversions > 0 ? totalCommission / totalConversions : 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return {
        totalConversions,
        totalCommission,
        averageCommission,
        conversionRate
      };
    } catch (error: any) {
      logger.error('Get commission stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const commissionService = new CommissionService();
export default commissionService;
