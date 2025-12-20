import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/affiliate/dashboard
 * Get affiliate dashboard data
 */
router.get('/dashboard', (req: Request, res: Response) => {
  // TODO: Implement authentication middleware
  // For now, return mock data
  res.json({
    success: true,
    data: {
      affiliate: {
        id: 'affiliate_1',
        referralCode: 'REF123456',
        level: 1,
        status: 'active',
        totalEarnings: 1250.50,
        totalReferrals: 15
      },
      stats: {
        clicks: 342,
        conversions: 15,
        conversionRate: '4.39',
        directReferrals: 15,
        totalReferrals: 27,
        earnings: {
          pending: 125.00,
          approved: 875.50,
          paid: 250.00,
          total: 1250.50
        }
      }
    }
  });
});

/**
 * GET /api/affiliate/referral-tree
 * Get referral tree structure
 */
router.get('/referral-tree', (req: Request, res: Response) => {
  // TODO: Implement authentication middleware
  // For now, return mock data
  res.json({
    success: true,
    data: [
      {
        id: 'ref_1',
        level: 1,
        status: 'active',
        totalEarnings: 450.00,
        createdAt: '2024-11-15T10:30:00Z',
        user: {
          name: 'Иван Петров',
          email: 'ivan@example.com'
        },
        referrals: [
          {
            id: 'ref_2',
            level: 2,
            status: 'active',
            totalEarnings: 150.00,
            createdAt: '2024-12-01T14:20:00Z',
            user: {
              name: 'Мария Сидорова',
              email: 'maria@example.com'
            },
            referrals: []
          }
        ]
      },
      {
        id: 'ref_3',
        level: 1,
        status: 'active',
        totalEarnings: 800.50,
        createdAt: '2024-10-20T09:15:00Z',
        user: {
          name: 'Алексей Иванов',
          email: 'alexey@example.com'
        },
        referrals: []
      }
    ]
  });
});

/**
 * GET /api/affiliate/stats
 * Get detailed statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      monthly: [
        { month: '2024-09', earnings: 250.00, referrals: 5 },
        { month: '2024-10', earnings: 420.50, referrals: 8 },
        { month: '2024-11', earnings: 380.00, referrals: 7 },
        { month: '2024-12', earnings: 200.00, referrals: 2 }
      ],
      topReferrals: [
        { name: 'Алексей Иванов', earnings: 800.50 },
        { name: 'Иван Петров', earnings: 450.00 }
      ]
    }
  });
});

/**
 * POST /api/affiliate/register
 * Register as affiliate
 */
router.post('/register', (req: Request, res: Response) => {
  const { userId } = req.body;

  // Generate referral code
  const referralCode = 'REF' + Math.random().toString(36).substring(2, 12).toUpperCase();

  res.json({
    success: true,
    message: 'Successfully registered as affiliate partner',
    data: {
      referralCode,
      status: 'active',
      level: 1
    }
  });
});

export default router;
