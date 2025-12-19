const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const commissionService = require('../services/commission.service');

const prisma = new PrismaClient();

/**
 * Получить всех партнёров
 */
exports.getAllAffiliates = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          {
            user: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            user: {
              email: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            referralCode: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      })
    };

    const [affiliates, total] = await Promise.all([
      prisma.affiliate.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          },
          referrer: {
            select: {
              referralCode: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.affiliate.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        affiliates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get all affiliates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliates',
      message: error.message
    });
  }
};

/**
 * Получить одного партнёра
 */
exports.getAffiliate = async (req, res) => {
  try {
    const { id } = req.params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        user: true,
        referrer: {
          include: {
            user: true
          }
        },
        referrals: {
          include: {
            user: true
          }
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        payouts: {
          orderBy: { requestedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    res.json({
      success: true,
      data: affiliate
    });
  } catch (error) {
    logger.error('Get affiliate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliate',
      message: error.message
    });
  }
};

/**
 * Обновить статус партнёра
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: { status }
    });

    logger.info('Affiliate status updated', {
      affiliateId: id,
      status,
      adminId: req.user.id
    });

    res.json({
      success: true,
      data: affiliate
    });
  } catch (error) {
    logger.error('Update affiliate status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status',
      message: error.message
    });
  }
};

/**
 * Верифицировать партнёра
 */
exports.verifyAffiliate = async (req, res) => {
  try {
    const { id } = req.params;

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        isVerified: true,
        status: 'active'
      }
    });

    logger.info('Affiliate verified', {
      affiliateId: id,
      adminId: req.user.id
    });

    res.json({
      success: true,
      data: affiliate
    });
  } catch (error) {
    logger.error('Verify affiliate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify affiliate',
      message: error.message
    });
  }
};

/**
 * Получить все комиссии
 */
exports.getAllCommissions = async (req, res) => {
  try {
    const { status, affiliateId, page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(status && { status }),
      ...(affiliateId && { affiliateId })
    };

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.commission.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        commissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get all commissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get commissions',
      message: error.message
    });
  }
};

/**
 * Одобрить комиссию
 */
exports.approveCommission = async (req, res) => {
  try {
    const { id } = req.params;

    const commission = await commissionService.approveCommission(id);

    logger.info('Commission approved by admin', {
      commissionId: id,
      adminId: req.user.id
    });

    res.json({
      success: true,
      data: commission
    });
  } catch (error) {
    logger.error('Approve commission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve commission',
      message: error.message
    });
  }
};

/**
 * Отклонить комиссию
 */
exports.rejectCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const commission = await prisma.commission.update({
      where: { id },
      data: {
        status: 'rejected'
      }
    });

    logger.info('Commission rejected by admin', {
      commissionId: id,
      reason,
      adminId: req.user.id
    });

    res.json({
      success: true,
      data: commission
    });
  } catch (error) {
    logger.error('Reject commission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject commission',
      message: error.message
    });
  }
};

/**
 * Получить все выплаты
 */
exports.getAllPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(status && { status })
    };

    const [payouts, total] = await Promise.all([
      prisma.affiliatePayout.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { requestedAt: 'desc' }
      }),
      prisma.affiliatePayout.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get all payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payouts',
      message: error.message
    });
  }
};

/**
 * Обработать выплату
 */
exports.processPayout = async (req, res) => {
  try {
    const { id } = req.params;

    const payout = await commissionService.processPayout(id);

    logger.info('Payout processed by admin', {
      payoutId: id,
      adminId: req.user.id
    });

    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    logger.error('Process payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payout',
      message: error.message
    });
  }
};

/**
 * Завершить выплату
 */
exports.completePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;

    const payout = await prisma.affiliatePayout.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        transactionId
      }
    });

    logger.info('Payout completed by admin', {
      payoutId: id,
      transactionId,
      adminId: req.user.id
    });

    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    logger.error('Complete payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete payout',
      message: error.message
    });
  }
};

/**
 * Отклонить выплату
 */
exports.rejectPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payout = await prisma.affiliatePayout.update({
      where: { id },
      data: {
        status: 'failed'
      }
    });

    logger.info('Payout rejected by admin', {
      payoutId: id,
      reason,
      adminId: req.user.id
    });

    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    logger.error('Reject payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject payout',
      message: error.message
    });
  }
};

/**
 * Получить настройки
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.affiliateSettings.findFirst();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings',
      message: error.message
    });
  }
};

/**
 * Обновить настройки
 */
exports.updateSettings = async (req, res) => {
  try {
    const {
      level1Rate,
      level2Rate,
      level3Rate,
      maxLevels,
      minPayoutAmount,
      commissionHoldDays,
      autoApprove,
      cookieLifetime
    } = req.body;

    const settings = await prisma.affiliateSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(level1Rate !== undefined && { level1Rate }),
        ...(level2Rate !== undefined && { level2Rate }),
        ...(level3Rate !== undefined && { level3Rate }),
        ...(maxLevels !== undefined && { maxLevels }),
        ...(minPayoutAmount !== undefined && { minPayoutAmount }),
        ...(commissionHoldDays !== undefined && { commissionHoldDays }),
        ...(autoApprove !== undefined && { autoApprove }),
        ...(cookieLifetime !== undefined && { cookieLifetime })
      },
      create: {
        id: 'default',
        level1Rate: level1Rate || 3.0,
        level2Rate: level2Rate || 1.5,
        level3Rate: level3Rate || 0.5,
        maxLevels: maxLevels || 3,
        minPayoutAmount: minPayoutAmount || 50,
        commissionHoldDays: commissionHoldDays || 30,
        autoApprove: autoApprove || false,
        cookieLifetime: cookieLifetime || 30
      }
    });

    logger.info('Affiliate settings updated', {
      adminId: req.user.id
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      message: error.message
    });
  }
};

/**
 * Получить аналитику
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Рассчитать дату начала
    const startDate = new Date();
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    const [
      totalAffiliates,
      activeAffiliates,
      totalCommissions,
      totalPayouts,
      recentConversions,
      conversionsByDay
    ] = await Promise.all([
      // Всего партнёров
      prisma.affiliate.count(),
      
      // Активных партнёров
      prisma.affiliate.count({
        where: { status: 'active' }
      }),
      
      // Общая сумма комиссий
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Общая сумма выплат
      prisma.affiliatePayout.aggregate({
        _sum: { amount: true },
        where: {
          status: 'completed',
          completedAt: { gte: startDate }
        }
      }),
      
      // Последние конверсии
      prisma.affiliateConversion.findMany({
        where: {
          convertedAt: { gte: startDate }
        },
        orderBy: { convertedAt: 'desc' },
        take: 100
      }),
      
      // Группировка конверсий по дням
      prisma.$queryRaw`
        SELECT 
          DATE(converted_at) as date,
          COUNT(*) as conversions,
          SUM(commission_amount) as revenue
        FROM affiliate_conversions
        WHERE converted_at >= ${startDate}
        GROUP BY DATE(converted_at)
        ORDER BY date DESC
      `
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalAffiliates,
          activeAffiliates,
          totalCommissions: totalCommissions._sum.amount || 0,
          totalPayouts: totalPayouts._sum.amount || 0,
          conversionRate: recentConversions.length > 0
            ? ((recentConversions.filter(c => c.status === 'approved').length / recentConversions.length) * 100).toFixed(2)
            : 0
        },
        conversionsByDay
      }
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      message: error.message
    });
  }
};

/**
 * Получить топ партнёров
 */
exports.getTopPerformers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topAffiliates = await prisma.affiliate.findMany({
      take: parseInt(limit),
      orderBy: {
        totalEarnings: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: topAffiliates
    });
  } catch (error) {
    logger.error('Get top performers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top performers',
      message: error.message
    });
  }
};

module.exports = exports;
