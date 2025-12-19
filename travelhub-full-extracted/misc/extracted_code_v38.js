// src/services/commission.service.js

/**
 * Распределить комиссии по всей цепочке рефералов
 * ИСПРАВЛЕННАЯ ВЕРСИЯ
 */
async distributeCommissions(affiliate, conversion, bookingAmount) {
  try {
    const settings = await prisma.affiliateSettings.findFirst();

    if (!settings) {
      throw new Error('Affiliate settings not found');
    }

    // ============================================
    // ШАГ 1: Рассчитать базовую комиссию TravelHub
    // ============================================
    // TravelHub получает от Booking.com/Travelpayouts
    const travelHubBaseCommission = (bookingAmount * settings.baseCommissionRate) / 100;
    
    logger.info('Base commission calculation', {
      bookingAmount,
      baseRate: settings.baseCommissionRate,
      travelHubCommission: travelHubBaseCommission
    });

    // ============================================
    // ШАГ 2: Распределить процент от комиссии TravelHub
    // ============================================
    const rates = [
      settings.level1Rate, // 50% от комиссии TravelHub
      settings.level2Rate, // 20% от комиссии TravelHub
      settings.level3Rate  // 10% от комиссии TravelHub
    ];

    const maxLevels = Math.min(settings.maxLevels, rates.length);

    let currentAffiliate = affiliate;
    let level = 1;
    const commissions = [];
    let totalPaidToAffiliates = 0;

    while (currentAffiliate && level <= maxLevels) {
      const ratePercentage = rates[level - 1]; // процент от комиссии TravelHub
      
      // Рассчитываем комиссию партнёра КАК ПРОЦЕНТ ОТ КОМИССИИ TRAVELHUB
      const affiliateCommission = (travelHubBaseCommission * ratePercentage) / 100;
      
      // Для отображения: какой это процент от суммы бронирования
      const effectiveRate = (affiliateCommission / bookingAmount) * 100;

      // Создать комиссию
      const commission = await prisma.commission.create({
        data: {
          affiliateId: currentAffiliate.id,
          conversionId: conversion.id,
          level,
          baseAmount: bookingAmount,
          rate: effectiveRate, // эффективная ставка от бронирования
          amount: affiliateCommission,
          currency: conversion.currency,
          status: settings.autoApprove ? 'approved' : 'pending'
        }
      });

      commissions.push(commission);
      totalPaidToAffiliates += affiliateCommission;

      logger.info('Commission created', {
        commissionId: commission.id,
        affiliateId: currentAffiliate.id,
        level,
        rateFromTravelHub: ratePercentage,
        effectiveRateFromBooking: effectiveRate.toFixed(2),
        amount: affiliateCommission.toFixed(2)
      });

      // Обновить общую сумму заработка партнёра
      await prisma.affiliate.update({
        where: { id: currentAffiliate.id },
        data: {
          totalEarnings: {
            increment: affiliateCommission
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

    // ============================================
    // ШАГ 3: Рассчитать прибыль TravelHub
    // ============================================
    const travelHubProfit = travelHubBaseCommission - totalPaidToAffiliates;
    const profitPercentage = (travelHubProfit / travelHubBaseCommission) * 100;

    logger.info('Commission distribution complete', {
      conversionId: conversion.id,
      bookingAmount,
      travelHubBaseCommission: travelHubBaseCommission.toFixed(2),
      totalPaidToAffiliates: totalPaidToAffiliates.toFixed(2),
      travelHubProfit: travelHubProfit.toFixed(2),
      profitMargin: `${profitPercentage.toFixed(1)}%`,
      levels: commissions.length
    });

    // Обновить конверсию
    await prisma.affiliateConversion.update({
      where: { id: conversion.id },
      data: {
        commissionRate: (totalPaidToAffiliates / bookingAmount) * 100,
        commissionAmount: totalPaidToAffiliates
      }
    });

    return commissions;
  } catch (error) {
    logger.error('Distribute commissions error:', error);
    throw error;
  }
}
