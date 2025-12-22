const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class CommissionService {
  /**
   * Обработать конверсию (бронирование) и начислить комиссии
   */
  async processConversion(bookingData) {
    try {
      const {
        userId,
        bookingId,
        bookingType,
        bookingAmount,
        currency,
        referralCode // из cookie или параметра
      } = bookingData;

      // Найти партнёра, который привёл клиента
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

      // Создать конверсию
      const conversion = await prisma.affiliateConversion.create({
        data: {
          affiliateId: sourceAffiliate.id,
          bookingId,
          bookingType,
          bookingAmount,
          currency,
          commissionRate: 0, // будет рассчитан
          commissionAmount: 0, // будет рассчитан
          status: 'pending'
        }
      });

      logger.info('Conversion created', {
        conversionId: conversion.id,
        affiliateId: sourceAffiliate.id,
        bookingId
      });

      // Начислить комиссии по всей цепочке
      await this.distributeCommissions(sourceAffiliate, conversion, bookingAmount);

      // Обновить клик как конвертированный
      await prisma.affiliateClick.updateMany({
        where: {
          affiliateId: sourceAffiliate.id,
          converted: false,
          clickedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // последние 30 дней
          }
        },
        data: {
          converted: true,
          conversionId: conversion.id
        }
      });

      return conversion;
    } catch (error) {
      logger.error('Process conversion error:', error);
      throw error;
    }
  }

  /**
   * Распределить комиссии по всей цепочке рефералов
   */
  async distributeCommissions(affiliate, conversion, bookingAmount) {
    try {
      // Получить настройки комиссий
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

      // Пройти по цепочке рефералов
      let currentAffiliate = affiliate;
      let level = 1;
      const commissions = [];

      while (currentAffiliate && level <= maxLevels) {
        const rate = rates[level - 1];
        const commissionAmount = (bookingAmount * rate) / 100;

        // Создать комиссию
        const commission = await prisma.commission.create({
          data: {
            affiliateId: currentAffiliate.id,
            conversionId: conversion.id,
            level,
            baseAmount: bookingAmount,
            rate,
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

        // Обновить общую сумму заработка партнёра
        await prisma.affiliate.update({
          where: { id: currentAffiliate.id },
          data: {
            totalEarnings: {
              increment: commissionAmount
            }
          }
        });

        // Перейти к родительскому партнёру
        if (currentAffiliate.referredBy) {
          currentAffiliate = await prisma.affiliate.findUnique({
            where: { id: currentAffiliate.referredBy }
          });
          level++;
        } else {
          break;
        }
      }

      // Обновить конверсию
      const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
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
    } catch (error) {
      logger.error('Distribute commissions error:', error);
      throw error;
    }
  }

  /**
   * Одобрить комиссию (после периода удержания)
   */
  async approveCommission(commissionId) {
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
    } catch (error) {
      logger.error('Approve commission error:', error);
      throw error;
    }
  }

  /**
   * Автоматически одобрить комиссии после периода удержания
   */
  async autoApproveCommissions() {
    try {
      const settings = await prisma.affiliateSettings.findFirst();
      
      if (!settings) {
        throw new Error('Affiliate settings not found');
      }

      const holdDate = new Date();
      holdDate.setDate(holdDate.getDate() - settings.commissionHoldDays);

      // Найти комиссии для одобрения
      const commissionsToApprove = await prisma.commission.findMany({
        where: {
          status: 'pending',
          createdAt: {
            lte: holdDate
          }
        }
      });

      logger.info(`Auto-approving ${commissionsToApprove.length} commissions`);

      // Одобрить каждую
      for (const commission of commissionsToApprove) {
        await this.approveCommission(commission.id);
      }

      return commissionsToApprove.length;
    } catch (error) {
      logger.error('Auto approve commissions error:', error);
      throw error;
    }
  }

  /**
   * Обработать выплату
   */
  async processPayout(payoutId) {
    try {
      const payout = await prisma.affiliatePayout.findUnique({
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

      // Обновить статус
      await prisma.affiliatePayout.update({
        where: { id: payoutId },
        data: {
          status: 'processing',
          processedAt: new Date()
        }
      });

      // Здесь должна быть интеграция с платёжной системой
      // PayPal, Stripe, Bank Transfer, etc.
      // Для примера, просто симулируем успешную выплату

      // Найти одобренные комиссии для этой выплаты
      const commissionsForPayout = await prisma.commission.findMany({
        where: {
          affiliateId: payout.affiliateId,
          status: 'approved'
        },
        orderBy: {
          approvedAt: 'asc'
        }
      });

      // Отметить комиссии как оплаченные
      let remainingAmount = payout.amount;
      const paidCommissionIds = [];

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

      // Завершить выплату
      const completedPayout = await prisma.affiliatePayout.update({
        where: { id: payoutId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          transactionId: `TXN-${Date.now()}` // В реальности - ID из платёжной системы
        }
      });

      logger.info('Payout processed', {
        payoutId,
        affiliateId: payout.affiliateId,
        amount: payout.amount,
        commissionsPaid: paidCommissionIds.length
      });

      return completedPayout;
    } catch (error) {
      logger.error('Process payout error:', error);
      
      // Отметить выплату как failed
      await prisma.affiliatePayout.update({
        where: { id: payoutId },
        data: {
          status: 'failed'
        }
      });

      throw error;
    }
  }
}

module.exports = new CommissionService();
