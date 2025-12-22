import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import { reportService } from '../services/report.service.js';

/**
 * Parse date range from query parameters
 */
function parseDateRange(req: Request): { startDate: Date; endDate: Date } {
  const { startDate, endDate } = req.query;

  // Default to last 30 days if not provided
  const end = endDate ? new Date(endDate as string) : new Date();
  const start = startDate
    ? new Date(startDate as string)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  return { startDate: start, endDate: end };
}

/**
 * Generate revenue report
 * GET /api/reports/revenue
 */
export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);

    const report = await reportService.generateRevenueReport(dateRange);

    res.json({
      success: true,
      data: report,
      dateRange: {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    logger.error('Error generating revenue report', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Generate affiliate performance report
 * GET /api/reports/affiliate/:affiliateId
 */
export const getAffiliateReport = async (req: Request, res: Response) => {
  try {
    const { affiliateId } = req.params;
    const dateRange = parseDateRange(req);

    // Check if user is the affiliate or an admin
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userId !== affiliateId && userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own affiliate report'
      });
    }

    const report = await reportService.generateAffiliateReport(affiliateId, dateRange);

    res.json({
      success: true,
      data: report,
      dateRange: {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    logger.error('Error generating affiliate report', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Generate user statistics report
 * GET /api/reports/users
 */
export const getUserReport = async (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);

    const report = await reportService.generateUserReport(dateRange);

    res.json({
      success: true,
      data: report,
      dateRange: {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    logger.error('Error generating user report', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Generate summary report
 * GET /api/reports/summary
 */
export const getSummaryReport = async (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);

    const report = await reportService.generateSummary(dateRange);

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error('Error generating summary report', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get my affiliate report (for logged-in affiliates)
 * GET /api/reports/my-affiliate
 */
export const getMyAffiliateReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const dateRange = parseDateRange(req);

    const report = await reportService.generateAffiliateReport(userId, dateRange);

    res.json({
      success: true,
      data: report,
      dateRange: {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    logger.error('Error generating my affiliate report', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
