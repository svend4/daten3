import express, { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Affiliate Routes
 * Handles affiliate program operations
 * Now using Prisma ORM with PostgreSQL
 */

/**
 * GET /api/affiliate/dashboard
 * Get affiliate dashboard data
 */
router.get('/dashboard', rateLimiters.moderate, authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Get affiliate data
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
      include: {
        referrals: true,
        commissions: true
      }
    });

    if (!affiliate) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Affiliate account not found. Please register as an affiliate first.'
      });
      return;
    }

    // Calculate stats
    const pendingCommissions = affiliate.commissions.filter((c: any) => c.status === 'pending')
      .reduce((sum: number, c: any) => sum + c.amount, 0);
    const approvedCommissions = affiliate.commissions.filter((c: any) => c.status === 'approved')
      .reduce((sum: number, c: any) => sum + c.amount, 0);
    const paidCommissions = affiliate.commissions.filter((c: any) => c.status === 'paid')
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    const conversionRate = affiliate.totalClicks > 0
      ? ((affiliate.totalReferrals / affiliate.totalClicks) * 100).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      data: {
        affiliate: {
          id: affiliate.id,
          referralCode: affiliate.referralCode,
          level: affiliate.level,
          status: affiliate.status,
          verified: affiliate.verified,
          totalEarnings: affiliate.totalEarnings,
          totalReferrals: affiliate.totalReferrals,
          totalClicks: affiliate.totalClicks
        },
        stats: {
          clicks: affiliate.totalClicks,
          conversions: affiliate.totalReferrals,
          conversionRate,
          directReferrals: affiliate.referrals.filter((r: any) => r.level === 1).length,
          totalReferrals: affiliate.totalReferrals,
          earnings: {
            pending: pendingCommissions,
            approved: approvedCommissions,
            paid: paidCommissions,
            total: affiliate.totalEarnings
          }
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Get dashboard error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: error.message });
  }
});

/**
 * GET /api/affiliate/referral-tree
 * Get referral tree structure
 */
router.get('/referral-tree', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
      include: {
        referrals: {
          include: {
            referredAffiliate: {
              include: {
                referrals: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!affiliate) {
      res.status(404).json({ success: false, error: 'Affiliate not found' });
      return;
    }

    // Build tree structure
    const tree = affiliate.referrals.map((ref: any) => ({
      id: ref.id,
      level: ref.level,
      status: ref.status,
      totalEarnings: ref.totalEarnings,
      createdAt: ref.createdAt,
      user: {
        name: ref.userName || 'Unknown',
        email: ref.userEmail || 'N/A'
      },
      referrals: ref.referredAffiliate?.referrals.map((subRef: any) => ({
        id: subRef.id,
        level: subRef.level,
        status: subRef.status,
        totalEarnings: subRef.totalEarnings,
        createdAt: subRef.createdAt,
        user: {
          name: subRef.userName || 'Unknown',
          email: subRef.userEmail || 'N/A'
        },
        referrals: []
      })) || []
    }));

    res.json({ success: true, data: tree });
  } catch (error: any) {
    console.error('❌ Get referral tree error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

/**
 * GET /api/affiliate/stats
 * Get detailed statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
      include: {
        commissions: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'desc' }
        },
        referrals: {
          orderBy: { totalEarnings: 'desc' },
          take: 10
        }
      }
    });

    if (!affiliate) {
      res.status(404).json({ success: false, error: 'Affiliate not found' });
      return;
    }

    // Group commissions by month
    const monthlyData: { [key: string]: { earnings: number; referrals: number } } = {};

    affiliate.commissions.forEach((comm: any) => {
      const month = comm.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { earnings: 0, referrals: 0 };
      }
      monthlyData[month].earnings += comm.amount;
    });

    const monthly = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    const topReferrals = affiliate.referrals
      .slice(0, 10)
      .map((ref: any) => ({
        name: ref.userName || 'Unknown',
        earnings: ref.totalEarnings
      }));

    res.json({
      success: true,
      data: { monthly, topReferrals }
    });
  } catch (error: any) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

/**
 * POST /api/affiliate/register
 * Register as affiliate
 */
router.post('/register', rateLimiters.strict, authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Check if already registered
    const existing = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Already registered',
        message: 'You are already registered as an affiliate.',
        data: {
          referralCode: existing.referralCode,
          status: existing.status
        }
      });
      return;
    }

    // Generate unique referral code
    let referralCode = '';
    let codeExists = true;

    while (codeExists) {
      referralCode = 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const existing = await prisma.affiliate.findUnique({
        where: { referralCode }
      });
      codeExists = !!existing;
    }

    // Create affiliate
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: req.user.id,
        referralCode,
        level: 1,
        status: 'pending',
        verified: false
      }
    });

    res.json({
      success: true,
      message: 'Successfully registered as affiliate partner. Your account is pending verification.',
      data: {
        id: affiliate.id,
        referralCode: affiliate.referralCode,
        status: affiliate.status,
        level: affiliate.level,
        verified: affiliate.verified
      }
    });
  } catch (error: any) {
    console.error('❌ Register affiliate error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

/**
 * GET /api/affiliate/validate/:code
 * Validate referral code
 */
router.get('/validate/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode: code },
      select: {
        id: true,
        referralCode: true,
        status: true,
        verified: true
      }
    });

    if (!affiliate) {
      res.json({
        success: true,
        valid: false,
        message: 'Referral code not found'
      });
      return;
    }

    if (affiliate.status !== 'active') {
      res.json({
        success: true,
        valid: false,
        message: 'Referral code is not active'
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      message: 'Referral code is valid',
      data: {
        code: affiliate.referralCode,
        verified: affiliate.verified
      }
    });
  } catch (error: any) {
    console.error('❌ Validate code error:', error);
    res.status(500).json({ success: false, error: 'Validation failed' });
  }
});

/**
 * GET /api/affiliate/earnings
 * Get earnings breakdown
 */
router.get('/earnings', rateLimiters.moderate, authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
      include: {
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!affiliate) {
      res.status(404).json({ success: false, error: 'Affiliate not found' });
      return;
    }

    const pending = affiliate.commissions
      .filter((c: any) => c.status === 'pending')
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    const approved = affiliate.commissions
      .filter((c: any) => c.status === 'approved')
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    const paid = affiliate.commissions
      .filter((c: any) => c.status === 'paid')
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    res.json({
      success: true,
      data: {
        total: affiliate.totalEarnings,
        pending,
        approved,
        paid,
        history: affiliate.commissions.map((c: any) => ({
          id: c.id,
          amount: c.amount,
          type: c.type,
          status: c.status,
          description: c.description,
          createdAt: c.createdAt,
          approvedAt: c.approvedAt,
          paidAt: c.paidAt
        }))
      }
    });
  } catch (error: any) {
    console.error('❌ Get earnings error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

/**
 * GET /api/affiliate/referrals
 * Get referral list (flat structure)
 */
router.get('/referrals', rateLimiters.moderate, authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
      include: {
        referrals: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!affiliate) {
      res.status(404).json({ success: false, error: 'Affiliate not found' });
      return;
    }

    const referrals = affiliate.referrals.map((ref: any) => ({
      id: ref.id,
      name: ref.userName || 'Unknown',
      email: ref.userEmail || 'N/A',
      level: ref.level,
      status: ref.status,
      earnings: ref.totalEarnings,
      joinedAt: ref.createdAt
    }));

    res.json({ success: true, data: referrals });
  } catch (error: any) {
    console.error('❌ Get referrals error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

/**
 * GET /api/affiliate/payouts
 * Get payout history
 */
router.get('/payouts', rateLimiters.moderate, authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
      include: {
        payouts: {
          orderBy: { requestedAt: 'desc' }
        }
      }
    });

    if (!affiliate) {
      res.status(404).json({ success: false, error: 'Affiliate not found' });
      return;
    }

    const payouts = affiliate.payouts.map((p: any) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      method: p.method,
      transactionId: p.transactionId,
      requestedAt: p.requestedAt,
      processedAt: p.processedAt,
      completedAt: p.completedAt,
      rejectedAt: p.rejectedAt,
      reason: p.reason
    }));

    res.json({ success: true, data: payouts });
  } catch (error: any) {
    console.error('❌ Get payouts error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

/**
 * POST /api/affiliate/payouts/request
 * Request payout
 */
router.post('/payouts/request', rateLimiters.strict, authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { amount, method } = req.body;

    if (!amount || !method) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Amount and method are required'
      });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
      include: {
        commissions: {
          where: { status: 'approved', payoutId: null }
        }
      }
    });

    if (!affiliate) {
      res.status(404).json({ success: false, error: 'Affiliate not found' });
      return;
    }

    // Check available balance
    const availableBalance = affiliate.commissions
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    if (amount > availableBalance) {
      res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        message: `Available balance: ${availableBalance}. Requested: ${amount}`
      });
      return;
    }

    // Check minimum payout amount
    const minPayout = parseFloat(process.env.AFFILIATE_MIN_PAYOUT || '50');
    if (amount < minPayout) {
      res.status(400).json({
        success: false,
        error: 'Amount too low',
        message: `Minimum payout amount is ${minPayout}`
      });
      return;
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        affiliateId: affiliate.id,
        amount,
        currency: 'RUB',
        method,
        status: 'pending'
      }
    });

    res.json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        method: payout.method,
        status: payout.status,
        requestedAt: payout.requestedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Request payout error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

/**
 * GET /api/affiliate/links
 * Get affiliate tracking links
 */
router.get('/links', rateLimiters.moderate, authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      res.status(404).json({ success: false, error: 'Affiliate not found' });
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const code = affiliate.referralCode;

    res.json({
      success: true,
      data: {
        referralCode: code,
        links: [
          {
            type: 'general',
            url: `${baseUrl}/?ref=${code}`,
            description: 'General referral link'
          },
          {
            type: 'hotels',
            url: `${baseUrl}/hotels?ref=${code}`,
            description: 'Hotels search page'
          },
          {
            type: 'flights',
            url: `${baseUrl}/flights?ref=${code}`,
            description: 'Flights search page'
          },
          {
            type: 'register',
            url: `${baseUrl}/register?ref=${code}`,
            description: 'Registration page'
          }
        ]
      }
    });
  } catch (error: any) {
    console.error('❌ Get links error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

/**
 * POST /api/affiliate/track-click
 * Track affiliate link click
 */
router.post('/track-click', rateLimiters.lenient, async (req: Request, res: Response) => {
  try {
    const { referralCode, source } = req.body;

    if (!referralCode) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Referral code is required'
      });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode }
    });

    if (!affiliate) {
      res.json({ success: true, message: 'Click tracked (code not found)' });
      return;
    }

    // Track click
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        referralCode,
        source: source || 'direct',
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    // Update total clicks
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { totalClicks: { increment: 1 } }
    });

    res.json({ success: true, message: 'Click tracked successfully' });
  } catch (error: any) {
    console.error('❌ Track click error:', error);
    res.status(500).json({ success: false, error: 'Tracking failed' });
  }
});

/**
 * GET /api/affiliate/settings
 * Get affiliate settings
 */
router.get('/settings', rateLimiters.moderate, authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      res.status(404).json({ success: false, error: 'Affiliate not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        paymentMethod: affiliate.paymentMethod || 'not_set',
        paymentDetails: affiliate.paymentDetails || {},
        notifications: {
          email: affiliate.emailNotifications,
          newReferral: affiliate.newReferralNotify,
          payoutProcessed: affiliate.payoutNotify
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Get settings error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

/**
 * PUT /api/affiliate/settings
 * Update affiliate settings
 */
router.put('/settings', rateLimiters.moderate, authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { paymentMethod, paymentDetails, notifications } = req.body;

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      res.status(404).json({ success: false, error: 'Affiliate not found' });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (paymentDetails !== undefined) updateData.paymentDetails = paymentDetails;
    if (notifications?.email !== undefined) updateData.emailNotifications = notifications.email;
    if (notifications?.newReferral !== undefined) updateData.newReferralNotify = notifications.newReferral;
    if (notifications?.payoutProcessed !== undefined) updateData.payoutNotify = notifications.payoutProcessed;

    const updated = await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        paymentMethod: updated.paymentMethod,
        notifications: {
          email: updated.emailNotifications,
          newReferral: updated.newReferralNotify,
          payoutProcessed: updated.payoutNotify
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});

export default router;
