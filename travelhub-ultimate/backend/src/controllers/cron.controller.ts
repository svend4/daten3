/**
 * Cron Job Management Controller
 * Admin endpoints for managing and triggering cron jobs
 */

import { Request, Response } from 'express';
import { manualCommissionAutoApproval } from '../services/cron.service.js';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Manually trigger commission auto-approval
 * POST /api/admin/cron/approve-commissions
 */
export const triggerCommissionApproval = async (req: Request, res: Response) => {
  try {
    logger.info('Manual commission approval triggered', {
      adminId: (req as any).user?.id,
    });

    const result = await manualCommissionAutoApproval();

    res.status(200).json({
      success: true,
      message: 'Commission auto-approval completed',
      data: {
        approved: result.approved,
        failed: result.failed,
        totalAmount: result.totalAmount.toFixed(2),
      },
    });
  } catch (error: any) {
    logger.error('Trigger commission approval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger commission approval',
      message: error.message,
    });
  }
};

/**
 * Get pending commissions statistics
 * GET /api/admin/cron/pending-commissions
 */
export const getPendingCommissionsStats = async (req: Request, res: Response) => {
  try {
    const holdDays = parseInt(process.env.COMMISSION_HOLD_DAYS || '30', 10);
    const holdDate = new Date();
    holdDate.setDate(holdDate.getDate() - holdDays);

    // Get all pending commissions
    const allPending = await prisma.commission.findMany({
      where: {
        status: 'pending',
      },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        affiliateId: true,
      },
    });

    // Separate into ready and not ready
    const readyForApproval = allPending.filter((c: any) => c.createdAt <= holdDate);
    const notReady = allPending.filter((c: any) => c.createdAt > holdDate);

    const readyAmount = readyForApproval.reduce((sum: number, c: any) => sum + c.amount, 0);
    const notReadyAmount = notReady.reduce((sum: number, c: any) => sum + c.amount, 0);
    const totalAmount = readyAmount + notReadyAmount;

    // Get oldest pending commission
    const oldestPending = allPending.length > 0
      ? allPending.reduce((oldest: any, current: any) =>
          current.createdAt < oldest.createdAt ? current : oldest
        )
      : null;

    res.status(200).json({
      success: true,
      data: {
        holdPeriodDays: holdDays,
        holdDate: holdDate.toISOString(),
        readyForApproval: {
          count: readyForApproval.length,
          totalAmount: readyAmount.toFixed(2),
        },
        notReadyYet: {
          count: notReady.length,
          totalAmount: notReadyAmount.toFixed(2),
        },
        total: {
          count: allPending.length,
          totalAmount: totalAmount.toFixed(2),
        },
        oldestPending: oldestPending
          ? {
              id: oldestPending.id,
              createdAt: oldestPending.createdAt,
              age: Math.floor(
                (Date.now() - oldestPending.createdAt.getTime()) / (1000 * 60 * 60 * 24)
              ),
              amount: oldestPending.amount,
            }
          : null,
      },
    });
  } catch (error: any) {
    logger.error('Get pending commissions stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending commissions statistics',
      message: error.message,
    });
  }
};

/**
 * Get cron job status and configuration
 * GET /api/admin/cron/status
 */
export const getCronJobStatus = async (req: Request, res: Response) => {
  try {
    const cronEnabled = process.env.ENABLE_CRON_JOBS !== 'false';
    const holdDays = parseInt(process.env.COMMISSION_HOLD_DAYS || '30', 10);

    res.status(200).json({
      success: true,
      data: {
        enabled: cronEnabled,
        jobs: {
          commissionAutoApproval: {
            enabled: cronEnabled,
            schedule: '0 2 * * *',
            description: 'Auto-approve commissions older than hold period',
            holdDays,
          },
          clickCleanup: {
            enabled: cronEnabled,
            schedule: '0 3 * * 0',
            description: 'Delete non-converted clicks older than 90 days',
            retentionDays: 90,
          },
          priceAlertCleanup: {
            enabled: cronEnabled,
            schedule: '0 1 * * 1',
            description: 'Delete inactive price alerts older than 30 days',
            retentionDays: 30,
          },
          metricsReset: {
            enabled: cronEnabled,
            schedule: '0 0 1 * *',
            description: 'Reset monthly performance metrics',
          },
        },
        environment: {
          ENABLE_CRON_JOBS: process.env.ENABLE_CRON_JOBS || 'not set (defaults to true)',
          COMMISSION_HOLD_DAYS: holdDays,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get cron job status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cron job status',
      message: error.message,
    });
  }
};

/**
 * Manually cleanup old affiliate clicks
 * POST /api/admin/cron/cleanup-clicks
 */
export const cleanupOldClicks = async (req: Request, res: Response) => {
  try {
    logger.info('Manual click cleanup triggered', {
      adminId: (req as any).user?.id,
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await prisma.affiliateClick.deleteMany({
      where: {
        converted: false,
        createdAt: {
          lte: cutoffDate,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Click cleanup completed',
      data: {
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Cleanup old clicks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old clicks',
      message: error.message,
    });
  }
};

/**
 * Manually cleanup old price alerts
 * POST /api/admin/cron/cleanup-price-alerts
 */
export const cleanupOldPriceAlerts = async (req: Request, res: Response) => {
  try {
    logger.info('Manual price alert cleanup triggered', {
      adminId: (req as any).user?.id,
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await prisma.priceAlert.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lte: cutoffDate,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Price alert cleanup completed',
      data: {
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Cleanup old price alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old price alerts',
      message: error.message,
    });
  }
};
