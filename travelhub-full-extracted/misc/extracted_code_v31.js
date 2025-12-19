const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Регистрация партнёра
 */
exports.register = async (req, res) => {
  try {
    const { referralCode } = req.body;
    const userId = req.user.id;

    // Проверить, не зарегистрирован ли уже
    const existing = await prisma.affiliate.findUnique({
      where: { userId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Already registered as affiliate'
      });
    }

    // Найти реферера (если есть)
    let referredBy = null;
    let level = 1;

    if (referralCode) {
      const referrer = await prisma.affiliate.findUnique({
        where: { referralCode }
      });

      if (referrer && referrer.status === 'active') {
        referredBy = referrer.id;
        level = referrer.level + 1;

        // Проверить максимальную глубину
        const settings = await prisma.affiliateSettings.findFirst();
        if (level > settings.maxLevels) {
          return res.status(400).json({
            success: false,
            error: 'Maximum referral depth reached'
          });
        }
      }
    }

    // Создать уникальный реферальный код
    const newReferralCode = nanoid(10);

    // Создать партнёра
    const affiliate = await prisma.affiliate.create({
      data: {
        userId,
        referralCode: newReferralCode,
        referredBy,
        level,
        status: 'pending', // требует одобрения
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Обновить счётчик рефералов у родителя
    if (referredBy) {
      await prisma.affiliate.update({
        where: { id: referredBy },
        data: {
          totalReferrals: { increment: 1 }
        }
      });
    }

    logger.info('Affiliate registered', {
      affiliateId: affiliate.id,
      userId,
      referredBy
    });

    res.status(201).json({
      success: true,
      data: affiliate
    });
  } catch (error) {
    logger.error('Affiliate registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register affiliate',
      message: error.message
    });
  }
};

/**
 * Получить дашборд партнёра
 */
exports.getDashboard = async (req, res) => {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        referrals: {
          select: {
            id: true,
            level: true,
            status: true,
            totalEarnings: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    // Статистика
    const stats = await getAffiliateStats(affiliate.id);

    res.json({
      success: true,
      data: {
        affiliate,
        stats
      }
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard',
      message: error.message
    });
  }
};

/**
 * Получить статистику партнёра
 */
exports.getStats = async (req, res) => {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    const stats = await getAffiliateStats(affiliate.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
      message: error.message
    });
  }
};

/**
 * Получить доходы партнёра
 */
exports.getEarnings = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    // Рассчитать дату начала периода
    const startDate = new Date();
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === 'all') {
      startDate.setFullYear(2000); // Все время
    }

    // Получить комиссии
    const commissions = await prisma.commission.findMany({
      where: {
        affiliateId: affiliate.id,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Группировка по дням
    const earningsByDay = {};
    commissions.forEach(commission => {
      const day = commission.createdAt.toISOString().split('T')[0];
      if (!earningsByDay[day]) {
        earningsByDay[day] = {
          date: day,
          pending: 0,
          approved: 0,
          paid: 0,
          total: 0
        };
      }
      
      earningsByDay[day][commission.status] += commission.amount;
      earningsByDay[day].total += commission.amount;
    });

    res.json({
      success: true,
      data: {
        commissions,
        byDay: Object.values(earningsByDay),
        summary: {
          total: commissions.reduce((sum, c) => sum + c.amount, 0),
          pending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
          approved: commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0),
          paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
        }
      }
    });
  } catch (error) {
    logger.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get earnings',
      message: error.message
    });
  }
};

/**
 * Получить дерево рефералов
 */
exports.getReferralTree = async (req, res) => {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    // Рекурсивная функция для построения дерева
    const buildTree = async (affiliateId, depth = 0, maxDepth = 3) => {
      if (depth >= maxDepth) return null;

      const referrals = await prisma.affiliate.findMany({
        where: { referredBy: affiliateId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });

      const tree = [];
      for (const referral of referrals) {
        const subtree = await buildTree(referral.id, depth + 1, maxDepth);
        tree.push({
          ...referral,
          referrals: subtree || []
        });
      }

      return tree;
    };

    const tree = await buildTree(affiliate.id);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    logger.error('Get referral tree error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral tree',
      message: error.message
    });
  }
};

/**
 * Запросить выплату
 */
exports.requestPayout = async (req, res) => {
  try {
    const { amount, method, details } = req.body;

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    // Проверить минимальную сумму
    if (amount < affiliate.minPayout) {
      return res.status(400).json({
        success: false,
        error: `Minimum payout amount is ${affiliate.minPayout}`
      });
    }

    // Проверить доступный баланс (одобренные комиссии)
    const approvedCommissions = await prisma.commission.aggregate({
      where: {
        affiliateId: affiliate.id,
        status: 'approved'
      },
      _sum: {
        amount: true
      }
    });

    const availableBalance = approvedCommissions._sum.amount || 0;

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${availableBalance}`
      });
    }

    // Создать запрос на выплату
    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount,
        method,
        details,
        status: 'pending'
      }
    });

    logger.info('Payout requested', {
      affiliateId: affiliate.id,
      payoutId: payout.id,
      amount
    });

    res.status(201).json({
      success: true,
      data: payout
    });
  } catch (error) {
    logger.error('Request payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request payout',
      message: error.message
    });
  }
};

/**
 * Отследить клик по реферальной ссылке
 */
exports.trackClick = async (req, res) => {
  try {
    const {
      referralCode,
      landingPage,
      utmSource,
      utmMedium,
      utmCampaign
    } = req.body;

    // Найти партнёра
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode }
    });

    if (!affiliate || affiliate.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Invalid referral code'
      });
    }

    // Получить IP и User-Agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers['referer'];

    // Сохранить клик
    const click = await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress,
        userAgent,
        referrer,
        landingPage,
        utmSource,
        utmMedium,
        utmCampaign
      }
    });

    // Установить cookie для отслеживания
    const settings = await prisma.affiliateSettings.findFirst();
    const cookieMaxAge = (settings?.cookieLifetime || 30) * 24 * 60 * 60 * 1000;

    res.cookie('aff_ref', referralCode, {
      maxAge: cookieMaxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    logger.info('Affiliate click tracked', {
      clickId: click.id,
      affiliateId: affiliate.id,
      referralCode
    });

    res.json({
      success: true,
      data: { tracked: true }
    });
  } catch (error) {
    logger.error('Track click error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track click',
      message: error.message
    });
  }
};

/**
 * Получить ссылки партнёра
 */
exports.getAffiliateLinks = async (req, res) => {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    const baseUrl = process.env.APP_URL || 'https://travelhub.com';
    const code = affiliate.referralCode;

    const links = {
      general: `${baseUrl}?ref=${code}`,
      flights: `${baseUrl}/flights?ref=${code}`,
      hotels: `${baseUrl}/hotels?ref=${code}`,
      withUtm: `${baseUrl}?ref=${code}&utm_source=affiliate&utm_medium=referral&utm_campaign=${code}`
    };

    res.json({
      success: true,
      data: {
        referralCode: code,
        links
      }
    });
  } catch (error) {
    logger.error('Get affiliate links error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliate links',
      message: error.message
    });
  }
};

/**
 * Вспомогательная функция - получить статистику партнёра
 */
async function getAffiliateStats(affiliateId) {
  const [
    totalClicks,
    totalConversions,
    pendingCommissions,
    approvedCommissions,
    paidCommissions,
    directReferrals,
    allReferrals
  ] = await Promise.all([
    // Клики
    prisma.affiliateClick.count({
      where: { affiliateId }
    }),
    
    // Конверсии
    prisma.affiliateConversion.count({
      where: { affiliateId }
    }),
    
    // Комиссии pending
    prisma.commission.aggregate({
      where: {
        affiliateId,
        status: 'pending'
      },
      _sum: { amount: true }
    }),
    
    // Комиссии approved
    prisma.commission.aggregate({
      where: {
        affiliateId,
        status: 'approved'
      },
      _sum: { amount: true }
    }),
    
    // Комиссии paid
    prisma.commission.aggregate({
      where: {
        affiliateId,
        status: 'paid'
      },
      _sum: { amount: true }
    }),
    
    // Прямые рефералы (уровень 1)
    prisma.affiliate.count({
      where: { referredBy: affiliateId }
    }),
    
    // Все рефералы (рекурсивно)
    getAllReferralsCount(affiliateId)
  ]);

  const conversionRate = totalClicks > 0
    ? ((totalConversions / totalClicks) * 100).toFixed(2)
    : 0;

  return {
    clicks: totalClicks,
    conversions: totalConversions,
    conversionRate: `${conversionRate}%`,
    directReferrals,
    totalReferrals: allReferrals,
    earnings: {
      pending: pendingCommissions._sum.amount || 0,
      approved: approvedCommissions._sum.amount || 0,
      paid: paidCommissions._sum.amount || 0,
      total: (pendingCommissions._sum.amount || 0) +
             (approvedCommissions._sum.amount || 0) +
             (paidCommissions._sum.amount || 0)
    }
  };
}

/**
 * Рекурсивный подсчёт всех рефералов
 */
async function getAllReferralsCount(affiliateId, counted = new Set()) {
  if (counted.has(affiliateId)) return 0;
  counted.add(affiliateId);

  const directReferrals = await prisma.affiliate.findMany({
    where: { referredBy: affiliateId },
    select: { id: true }
  });

  let total = directReferrals.length;

  for (const referral of directReferrals) {
    total += await getAllReferralsCount(referral.id, counted);
  }

  return total;
}

module.exports = exports;
