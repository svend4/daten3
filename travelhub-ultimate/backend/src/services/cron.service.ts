/**
 * Cron Job Service
 * Automated scheduled tasks for commission approval, data cleanup, etc.
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { commissionService } from './commission.service.js';

const prisma = new PrismaClient();

/**
 * Commission auto-approval holding period (days)
 * Can be configured via environment variable
 */
const COMMISSION_HOLD_DAYS = parseInt(process.env.COMMISSION_HOLD_DAYS || '30', 10);

/**
 * Auto-approve commissions after holding period
 * Runs daily at 2 AM
 */
export const startCommissionAutoApprovalCron = () => {
  // Run every day at 2:00 AM
  const schedule = '0 2 * * *';

  cron.schedule(schedule, async () => {
    try {
      logger.info('Starting commission auto-approval cron job', {
        holdDays: COMMISSION_HOLD_DAYS,
      });

      const holdDate = new Date();
      holdDate.setDate(holdDate.getDate() - COMMISSION_HOLD_DAYS);

      // Find pending commissions older than hold period
      const commissionsToApprove = await prisma.commission.findMany({
        where: {
          status: 'pending',
          createdAt: {
            lte: holdDate,
          },
        },
        include: {
          affiliate: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

      if (commissionsToApprove.length === 0) {
        logger.info('No commissions to auto-approve');
        return;
      }

      logger.info(`Found ${commissionsToApprove.length} commissions to auto-approve`);

      let approvedCount = 0;
      let failedCount = 0;
      let totalAmount = 0;

      // Approve each commission
      for (const commission of commissionsToApprove) {
        try {
          await commissionService.approveCommission(commission.id);
          approvedCount++;
          totalAmount += commission.amount;

          logger.info('Commission auto-approved', {
            commissionId: commission.id,
            affiliateId: commission.affiliateId,
            amount: commission.amount,
            age: Math.floor(
              (Date.now() - commission.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            ),
          });
        } catch (error: any) {
          failedCount++;
          logger.error('Failed to auto-approve commission', {
            commissionId: commission.id,
            error: error.message,
          });
        }
      }

      logger.info('Commission auto-approval cron job completed', {
        total: commissionsToApprove.length,
        approved: approvedCount,
        failed: failedCount,
        totalAmount: totalAmount.toFixed(2),
      });

      // Send notification to admin (optional)
      if (approvedCount > 0) {
        // TODO: Integrate with notification service
        // await notificationService.notifyAdmin({...});
      }
    } catch (error: any) {
      logger.error('Commission auto-approval cron job error:', error);
    }
  });

  logger.info('Commission auto-approval cron job started', {
    schedule,
    holdDays: COMMISSION_HOLD_DAYS,
    description: 'Runs daily at 2:00 AM',
  });
};

/**
 * Cleanup old affiliate clicks (older than 90 days)
 * Runs weekly on Sunday at 3 AM
 */
export const startClickCleanupCron = () => {
  // Run every Sunday at 3:00 AM
  const schedule = '0 3 * * 0';

  cron.schedule(schedule, async () => {
    try {
      logger.info('Starting affiliate click cleanup cron job');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days

      // Delete old non-converted clicks
      const result = await prisma.affiliateClick.deleteMany({
        where: {
          converted: false,
          createdAt: {
            lte: cutoffDate,
          },
        },
      });

      logger.info('Affiliate click cleanup completed', {
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
      });
    } catch (error: any) {
      logger.error('Affiliate click cleanup cron job error:', error);
    }
  });

  logger.info('Affiliate click cleanup cron job started', {
    schedule,
    description: 'Runs weekly on Sunday at 3:00 AM',
    retentionDays: 90,
  });
};

/**
 * Cleanup old price alerts (checked and older than 30 days)
 * Runs weekly on Monday at 1 AM
 */
export const startPriceAlertCleanupCron = () => {
  // Run every Monday at 1:00 AM
  const schedule = '0 1 * * 1';

  cron.schedule(schedule, async () => {
    try {
      logger.info('Starting price alert cleanup cron job');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days

      // Delete old inactive price alerts
      const result = await prisma.priceAlert.deleteMany({
        where: {
          isActive: false,
          updatedAt: {
            lte: cutoffDate,
          },
        },
      });

      logger.info('Price alert cleanup completed', {
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
      });
    } catch (error: any) {
      logger.error('Price alert cleanup cron job error:', error);
    }
  });

  logger.info('Price alert cleanup cron job started', {
    schedule,
    description: 'Runs weekly on Monday at 1:00 AM',
    retentionDays: 30,
  });
};

/**
 * Performance metrics reset (monthly)
 * Runs on the 1st of each month at 0:00 AM
 */
export const startMetricsResetCron = () => {
  // Run on the 1st of each month at midnight
  const schedule = '0 0 1 * *';

  cron.schedule(schedule, async () => {
    try {
      logger.info('Starting monthly performance metrics reset');

      // Archive current metrics before reset
      // TODO: Implement metrics archiving to database
      // For now, just log the reset
      logger.info('Performance metrics reset completed');
    } catch (error: any) {
      logger.error('Performance metrics reset cron job error:', error);
    }
  });

  logger.info('Performance metrics reset cron job started', {
    schedule,
    description: 'Runs on 1st of each month at midnight',
  });
};

/**
 * Manual trigger for commission auto-approval (for testing/admin)
 */
export const manualCommissionAutoApproval = async (): Promise<{
  approved: number;
  failed: number;
  totalAmount: number;
}> => {
  logger.info('Manual commission auto-approval triggered');

  const holdDate = new Date();
  holdDate.setDate(holdDate.getDate() - COMMISSION_HOLD_DAYS);

  const commissionsToApprove = await prisma.commission.findMany({
    where: {
      status: 'pending',
      createdAt: {
        lte: holdDate,
      },
    },
  });

  let approvedCount = 0;
  let failedCount = 0;
  let totalAmount = 0;

  for (const commission of commissionsToApprove) {
    try {
      await commissionService.approveCommission(commission.id);
      approvedCount++;
      totalAmount += commission.amount;
    } catch (error: any) {
      failedCount++;
      logger.error('Failed to approve commission', {
        commissionId: commission.id,
        error: error.message,
      });
    }
  }

  return {
    approved: approvedCount,
    failed: failedCount,
    totalAmount,
  };
};

/**
 * Initialize all cron jobs
 */
export const initializeCronJobs = () => {
  logger.info('Initializing cron jobs...');

  // Check if cron jobs are enabled
  const cronEnabled = process.env.ENABLE_CRON_JOBS !== 'false';

  if (!cronEnabled) {
    logger.warn('Cron jobs are disabled via ENABLE_CRON_JOBS environment variable');
    return;
  }

  // Start all cron jobs
  startCommissionAutoApprovalCron();
  startClickCleanupCron();
  startPriceAlertCleanupCron();
  startMetricsResetCron();

  logger.info('All cron jobs initialized successfully');
};

// Export individual functions for testing
export default {
  initializeCronJobs,
  manualCommissionAutoApproval,
  startCommissionAutoApprovalCron,
  startClickCleanupCron,
  startPriceAlertCleanupCron,
  startMetricsResetCron,
};
