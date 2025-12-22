import express, { Request, Response } from 'express';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// ===== AFFILIATE MANAGEMENT =====

/**
 * GET /api/admin/affiliates
 * Get all affiliates
 */
router.get('/affiliates', rateLimiters.moderate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Build filter conditions
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Fetch affiliates with user data and pagination
    const [affiliates, total] = await Promise.all([
      prisma.affiliate.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        }
      }),
      prisma.affiliate.count({ where })
    ]);

    res.json({
      success: true,
      data: affiliates,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('❌ Get affiliates error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve affiliates.'
    });
  }
});

/**
 * GET /api/admin/affiliates/:id
 * Get single affiliate details
 */
router.get('/affiliates/:id', rateLimiters.moderate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch affiliate with all relations
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        referrals: true,
        commissions: true,
        payouts: true
      }
    });

    if (!affiliate) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Affiliate not found.'
      });
      return;
    }

    // Calculate stats
    const conversionRate = affiliate.totalClicks > 0
      ? ((affiliate.totalReferrals / affiliate.totalClicks) * 100).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      data: {
        ...affiliate,
        stats: {
          clicks: affiliate.totalClicks,
          conversions: affiliate.totalReferrals,
          conversionRate: `${conversionRate}%`
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Get affiliate error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve affiliate details.'
    });
  }
});

/**
 * PATCH /api/admin/affiliates/:id/status
 * Update affiliate status
 */
router.patch('/affiliates/:id/status', rateLimiters.strict, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'active', 'suspended', 'banned'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    // Check if affiliate exists
    const affiliate = await prisma.affiliate.findUnique({
      where: { id }
    });

    if (!affiliate) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Affiliate not found.'
      });
      return;
    }

    // Update status
    const updatedAffiliate = await prisma.affiliate.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      message: `Affiliate status updated to ${status}`,
      data: {
        id: updatedAffiliate.id,
        status: updatedAffiliate.status,
        updatedAt: updatedAffiliate.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Update affiliate status error:', error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: 'Failed to update affiliate status.'
    });
  }
});

/**
 * PATCH /api/admin/affiliates/:id/verify
 * Verify affiliate
 */
router.patch('/affiliates/:id/verify', rateLimiters.strict, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if affiliate exists
    const affiliate = await prisma.affiliate.findUnique({
      where: { id }
    });

    if (!affiliate) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Affiliate not found.'
      });
      return;
    }

    if (affiliate.verified) {
      res.status(400).json({
        success: false,
        error: 'Already verified',
        message: 'This affiliate is already verified.'
      });
      return;
    }

    // Verify affiliate and activate if pending
    const updatedAffiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        verified: true,
        status: affiliate.status === 'pending' ? 'active' : affiliate.status
      }
    });

    res.json({
      success: true,
      message: 'Affiliate verified successfully',
      data: {
        id: updatedAffiliate.id,
        verified: updatedAffiliate.verified,
        status: updatedAffiliate.status,
        updatedAt: updatedAffiliate.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Verify affiliate error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: 'Failed to verify affiliate.'
    });
  }
});

// ===== COMMISSION MANAGEMENT =====

/**
 * GET /api/admin/commissions
 * Get all commissions
 */
router.get('/commissions', rateLimiters.moderate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, affiliateId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Build filter conditions
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (affiliateId) {
      where.affiliateId = affiliateId as string;
    }

    // Fetch commissions with affiliate data and pagination
    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          affiliate: {
            select: {
              id: true,
              referralCode: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.commission.count({ where })
    ]);

    res.json({
      success: true,
      data: commissions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('❌ Get commissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve commissions.'
    });
  }
});

/**
 * PATCH /api/admin/commissions/:id/approve
 * Approve commission
 */
router.patch('/commissions/:id/approve', rateLimiters.strict, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if commission exists
    const commission = await prisma.commission.findUnique({
      where: { id },
      include: { affiliate: true }
    });

    if (!commission) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Commission not found.'
      });
      return;
    }

    if (commission.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Commission is already ${commission.status}.`
      });
      return;
    }

    // Update commission status
    const updatedCommission = await prisma.commission.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Commission approved successfully',
      data: {
        id: updatedCommission.id,
        status: updatedCommission.status,
        approvedAt: updatedCommission.approvedAt,
        updatedAt: updatedCommission.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Approve commission error:', error);
    res.status(500).json({
      success: false,
      error: 'Approval failed',
      message: 'Failed to approve commission.'
    });
  }
});

/**
 * PATCH /api/admin/commissions/:id/reject
 * Reject commission
 */
router.patch('/commissions/:id/reject', rateLimiters.strict, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if commission exists
    const commission = await prisma.commission.findUnique({
      where: { id }
    });

    if (!commission) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Commission not found.'
      });
      return;
    }

    if (commission.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Commission is already ${commission.status}.`
      });
      return;
    }

    // Update commission status (store reason in notes field)
    const updatedCommission = await prisma.commission.update({
      where: { id },
      data: {
        status: 'rejected',
        notes: reason || 'Rejected by admin'
      }
    });

    res.json({
      success: true,
      message: 'Commission rejected',
      data: {
        id: updatedCommission.id,
        status: updatedCommission.status,
        reason: updatedCommission.notes,
        updatedAt: updatedCommission.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Reject commission error:', error);
    res.status(500).json({
      success: false,
      error: 'Rejection failed',
      message: 'Failed to reject commission.'
    });
  }
});

// ===== PAYOUT MANAGEMENT =====

/**
 * GET /api/admin/payouts
 * Get all payout requests
 */
router.get('/payouts', rateLimiters.moderate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, affiliateId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Build filter conditions
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (affiliateId) {
      where.affiliateId = affiliateId as string;
    }

    // Fetch payouts with affiliate data and pagination
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { requestedAt: 'desc' },
        include: {
          affiliate: {
            select: {
              id: true,
              referralCode: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.payout.count({ where })
    ]);

    res.json({
      success: true,
      data: payouts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('❌ Get payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve payouts.'
    });
  }
});

/**
 * POST /api/admin/payouts/:id/process
 * Process payout
 */
router.post('/payouts/:id/process', rateLimiters.strict, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if payout exists
    const payout = await prisma.payout.findUnique({
      where: { id }
    });

    if (!payout) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Payout not found.'
      });
      return;
    }

    if (payout.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Payout is already ${payout.status}.`
      });
      return;
    }

    // Update payout status to processing
    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: {
        status: 'processing',
        processedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Payout processing started',
      data: {
        id: updatedPayout.id,
        status: updatedPayout.status,
        processedAt: updatedPayout.processedAt,
        updatedAt: updatedPayout.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Process payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Processing failed',
      message: 'Failed to process payout.'
    });
  }
});

/**
 * PATCH /api/admin/payouts/:id/complete
 * Complete payout
 */
router.patch('/payouts/:id/complete', rateLimiters.strict, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;

    // Check if payout exists
    const payout = await prisma.payout.findUnique({
      where: { id },
      include: { commissions: true }
    });

    if (!payout) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Payout not found.'
      });
      return;
    }

    if (payout.status === 'completed') {
      res.status(400).json({
        success: false,
        error: 'Already completed',
        message: 'This payout is already completed.'
      });
      return;
    }

    // Complete payout and mark commissions as paid
    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: {
        status: 'completed',
        transactionId: transactionId || null,
        completedAt: new Date()
      }
    });

    // Mark all associated commissions as paid
    if (payout.commissions && payout.commissions.length > 0) {
      await prisma.commission.updateMany({
        where: {
          payoutId: id,
          status: 'approved'
        },
        data: {
          status: 'paid'
        }
      });
    }

    res.json({
      success: true,
      message: 'Payout completed successfully',
      data: {
        id: updatedPayout.id,
        status: updatedPayout.status,
        transactionId: updatedPayout.transactionId,
        completedAt: updatedPayout.completedAt,
        updatedAt: updatedPayout.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Complete payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Completion failed',
      message: 'Failed to complete payout.'
    });
  }
});

/**
 * PATCH /api/admin/payouts/:id/reject
 * Reject payout
 */
router.patch('/payouts/:id/reject', rateLimiters.strict, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if payout exists
    const payout = await prisma.payout.findUnique({
      where: { id }
    });

    if (!payout) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Payout not found.'
      });
      return;
    }

    if (payout.status === 'completed') {
      res.status(400).json({
        success: false,
        error: 'Cannot reject',
        message: 'Cannot reject a completed payout.'
      });
      return;
    }

    // Update payout status to rejected
    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: {
        status: 'rejected',
        notes: reason || 'Rejected by admin'
      }
    });

    res.json({
      success: true,
      message: 'Payout rejected',
      data: {
        id: updatedPayout.id,
        status: updatedPayout.status,
        reason: updatedPayout.notes,
        updatedAt: updatedPayout.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Reject payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Rejection failed',
      message: 'Failed to reject payout.'
    });
  }
});

// ===== SETTINGS =====

/**
 * GET /api/admin/settings
 * Get affiliate program settings
 */
router.get('/settings', rateLimiters.moderate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Settings from environment variables with defaults
    const settings = {
      commissionRates: {
        level1: parseFloat(process.env.AFFILIATE_COMMISSION_LEVEL1 || '5.0'),
        level2: parseFloat(process.env.AFFILIATE_COMMISSION_LEVEL2 || '2.5'),
        level3: parseFloat(process.env.AFFILIATE_COMMISSION_LEVEL3 || '1.0')
      },
      minPayoutAmount: parseFloat(process.env.AFFILIATE_MIN_PAYOUT || '50.00'),
      payoutSchedule: process.env.AFFILIATE_PAYOUT_SCHEDULE || 'monthly',
      autoApproveCommissions: process.env.AFFILIATE_AUTO_APPROVE === 'true',
      requireVerification: process.env.AFFILIATE_REQUIRE_VERIFICATION !== 'false'
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error('❌ Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve settings.'
    });
  }
});

/**
 * PUT /api/admin/settings
 * Update affiliate program settings
 */
router.put('/settings', rateLimiters.strict, async (req: Request, res: Response): Promise<void> => {
  try {
    // NOTE: Settings are currently stored in environment variables
    // In a production system, you might want to store these in a database
    // For now, this endpoint returns information about how to update settings

    res.json({
      success: true,
      message: 'Settings are configured via environment variables',
      info: {
        note: 'To update settings, modify the following environment variables and restart the server:',
        variables: {
          AFFILIATE_COMMISSION_LEVEL1: 'Commission rate for direct referrals (default: 5.0)',
          AFFILIATE_COMMISSION_LEVEL2: 'Commission rate for level 2 referrals (default: 2.5)',
          AFFILIATE_COMMISSION_LEVEL3: 'Commission rate for level 3 referrals (default: 1.0)',
          AFFILIATE_MIN_PAYOUT: 'Minimum payout amount (default: 50.00)',
          AFFILIATE_PAYOUT_SCHEDULE: 'Payout schedule: daily, weekly, monthly (default: monthly)',
          AFFILIATE_AUTO_APPROVE: 'Auto-approve commissions: true/false (default: false)',
          AFFILIATE_REQUIRE_VERIFICATION: 'Require affiliate verification: true/false (default: true)'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: 'Failed to update settings.'
    });
  }
});

// ===== ANALYTICS =====

/**
 * GET /api/admin/analytics
 * Get affiliate program analytics
 */
router.get('/analytics', rateLimiters.moderate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get overview stats
    const [
      totalAffiliates,
      activeAffiliates,
      pendingPayoutsData,
      thisMonthCommissionsData,
      allCommissions
    ] = await Promise.all([
      prisma.affiliate.count(),
      prisma.affiliate.count({ where: { status: 'active' } }),
      prisma.payout.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true }
      }),
      prisma.commission.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      }),
      prisma.commission.aggregate({
        _sum: { amount: true }
      })
    ]);

    // Get affiliates grouped by level
    const affiliatesByLevel = await prisma.affiliate.groupBy({
      by: ['level'],
      _count: { id: true },
      _sum: { totalEarnings: true }
    });

    // Format level data
    const byLevel: any = {};
    affiliatesByLevel.forEach((item: any) => {
      byLevel[`level${item.level}`] = {
        count: item._count.id,
        earnings: item._sum.totalEarnings || 0
      };
    });

    // Get monthly data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyCommissions = await prisma.commission.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      select: {
        createdAt: true,
        amount: true
      }
    });

    // Group by month
    const monthlyData: any = {};
    monthlyCommissions.forEach((comm: any) => {
      const monthKey = `${comm.createdAt.getFullYear()}-${String(comm.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, commissions: 0 };
      }
      monthlyData[monthKey].commissions += comm.amount;
    });

    const monthly = Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        overview: {
          totalAffiliates,
          activeAffiliates,
          totalEarnings: allCommissions._sum.amount || 0,
          pendingPayouts: pendingPayoutsData._sum.amount || 0,
          thisMonthCommissions: thisMonthCommissionsData._sum.amount || 0
        },
        monthly,
        byLevel
      }
    });
  } catch (error: any) {
    console.error('❌ Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve analytics.'
    });
  }
});

/**
 * GET /api/admin/analytics/top-performers
 * Get top performing affiliates
 */
router.get('/analytics/top-performers', rateLimiters.moderate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Get top affiliates by total earnings
    const topAffiliates = await prisma.affiliate.findMany({
      where: {
        status: 'active',
        verified: true
      },
      take: limitNum,
      orderBy: {
        totalEarnings: 'desc'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Format data with rankings
    const data = topAffiliates.map((affiliate: any, index: number) => {
      const conversionRate = affiliate.totalClicks > 0
        ? ((affiliate.totalReferrals / affiliate.totalClicks) * 100).toFixed(2)
        : '0.00';

      return {
        rank: index + 1,
        affiliateId: affiliate.id,
        referralCode: affiliate.referralCode,
        name: `${affiliate.user.firstName} ${affiliate.user.lastName}`,
        email: affiliate.user.email,
        totalEarnings: affiliate.totalEarnings,
        totalReferrals: affiliate.totalReferrals,
        totalClicks: affiliate.totalClicks,
        conversionRate: `${conversionRate}%`
      };
    });

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('❌ Get top performers error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve top performers.'
    });
  }
});

export default router;
