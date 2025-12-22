/**
 * Loyalty Program Service
 * Manages points, tiers, rewards, and member benefits
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export interface LoyaltyMember {
  userId: string;
  tier: LoyaltyTier;
  points: number;
  lifetimePoints: number;
  tierProgress: number; // Points needed for next tier
  nextTier?: LoyaltyTier;
  memberSince: Date;
  tierExpiresAt?: Date;
  benefits: LoyaltyBenefit[];
}

export interface LoyaltyBenefit {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'upgrade' | 'priority' | 'lounge_access' | 'free_cancellation' | 'extra_baggage';
  value?: number; // Percentage for discounts, quantity for others
  tier: LoyaltyTier;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'redeem' | 'expire' | 'bonus' | 'refund';
  points: number;
  balance: number;
  reason: string;
  relatedId?: string; // Booking ID, reward ID, etc.
  createdAt: Date;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'upgrade' | 'free_night' | 'voucher' | 'experience';
  value: number;
  expiresAt?: Date;
  availableQuantity?: number;
  tier?: LoyaltyTier; // Minimum tier required
}

// Tier thresholds
const TIER_THRESHOLDS = {
  [LoyaltyTier.BRONZE]: 0,
  [LoyaltyTier.SILVER]: 10000,
  [LoyaltyTier.GOLD]: 25000,
  [LoyaltyTier.PLATINUM]: 50000,
  [LoyaltyTier.DIAMOND]: 100000,
};

// Tier benefits
const TIER_BENEFITS: Record<LoyaltyTier, LoyaltyBenefit[]> = {
  [LoyaltyTier.BRONZE]: [
    {
      id: 'bronze_1',
      name: '5% Discount',
      description: 'Get 5% off all bookings',
      type: 'discount',
      value: 5,
      tier: LoyaltyTier.BRONZE,
    },
  ],
  [LoyaltyTier.SILVER]: [
    {
      id: 'silver_1',
      name: '10% Discount',
      description: 'Get 10% off all bookings',
      type: 'discount',
      value: 10,
      tier: LoyaltyTier.SILVER,
    },
    {
      id: 'silver_2',
      name: 'Free Cancellation',
      description: 'Free cancellation on all bookings',
      type: 'free_cancellation',
      tier: LoyaltyTier.SILVER,
    },
  ],
  [LoyaltyTier.GOLD]: [
    {
      id: 'gold_1',
      name: '15% Discount',
      description: 'Get 15% off all bookings',
      type: 'discount',
      value: 15,
      tier: LoyaltyTier.GOLD,
    },
    {
      id: 'gold_2',
      name: 'Room Upgrade',
      description: 'Free room upgrade when available',
      type: 'upgrade',
      tier: LoyaltyTier.GOLD,
    },
    {
      id: 'gold_3',
      name: 'Priority Support',
      description: '24/7 priority customer support',
      type: 'priority',
      tier: LoyaltyTier.GOLD,
    },
  ],
  [LoyaltyTier.PLATINUM]: [
    {
      id: 'plat_1',
      name: '20% Discount',
      description: 'Get 20% off all bookings',
      type: 'discount',
      value: 20,
      tier: LoyaltyTier.PLATINUM,
    },
    {
      id: 'plat_2',
      name: 'Guaranteed Upgrade',
      description: 'Guaranteed room upgrade',
      type: 'upgrade',
      tier: LoyaltyTier.PLATINUM,
    },
    {
      id: 'plat_3',
      name: 'Airport Lounge Access',
      description: 'Access to airport lounges worldwide',
      type: 'lounge_access',
      tier: LoyaltyTier.PLATINUM,
    },
    {
      id: 'plat_4',
      name: 'Extra Baggage',
      description: '1 additional checked bag free',
      type: 'extra_baggage',
      value: 1,
      tier: LoyaltyTier.PLATINUM,
    },
  ],
  [LoyaltyTier.DIAMOND]: [
    {
      id: 'dia_1',
      name: '30% Discount',
      description: 'Get 30% off all bookings',
      type: 'discount',
      value: 30,
      tier: LoyaltyTier.DIAMOND,
    },
    {
      id: 'dia_2',
      name: 'Suite Upgrade',
      description: 'Guaranteed suite upgrade',
      type: 'upgrade',
      tier: LoyaltyTier.DIAMOND,
    },
    {
      id: 'dia_3',
      name: 'Concierge Service',
      description: 'Personal travel concierge',
      type: 'priority',
      tier: LoyaltyTier.DIAMOND,
    },
    {
      id: 'dia_4',
      name: '2 Extra Bags',
      description: '2 additional checked bags free',
      type: 'extra_baggage',
      value: 2,
      tier: LoyaltyTier.DIAMOND,
    },
  ],
};

/**
 * Get or create loyalty member profile
 */
export async function getLoyaltyMember(userId: string): Promise<LoyaltyMember> {
  try {
    logger.info(`Getting loyalty member profile for user ${userId}`);

    // Mock implementation - would query database
    const member: LoyaltyMember = {
      userId,
      tier: LoyaltyTier.GOLD,
      points: 30000,
      lifetimePoints: 35000,
      tierProgress: 20000, // Points to Platinum (50k)
      nextTier: LoyaltyTier.PLATINUM,
      memberSince: new Date('2024-01-01'),
      benefits: TIER_BENEFITS[LoyaltyTier.GOLD],
    };

    return member;
  } catch (error: any) {
    logger.error('Error getting loyalty member:', error);
    throw error;
  }
}

/**
 * Calculate tier from points
 */
function calculateTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= TIER_THRESHOLDS[LoyaltyTier.DIAMOND]) return LoyaltyTier.DIAMOND;
  if (lifetimePoints >= TIER_THRESHOLDS[LoyaltyTier.PLATINUM]) return LoyaltyTier.PLATINUM;
  if (lifetimePoints >= TIER_THRESHOLDS[LoyaltyTier.GOLD]) return LoyaltyTier.GOLD;
  if (lifetimePoints >= TIER_THRESHOLDS[LoyaltyTier.SILVER]) return LoyaltyTier.SILVER;
  return LoyaltyTier.BRONZE;
}

/**
 * Award points for a booking
 */
export async function awardPoints(
  userId: string,
  bookingId: string,
  amount: number,
  reason: string = 'Booking'
): Promise<PointsTransaction> {
  try {
    logger.info(`Awarding ${amount} points to user ${userId} for ${reason}`);

    const member = await getLoyaltyMember(userId);
    const newBalance = member.points + amount;
    const newLifetimePoints = member.lifetimePoints + amount;

    // Check for tier upgrade
    const oldTier = member.tier;
    const newTier = calculateTier(newLifetimePoints);
    const tierUpgraded = newTier !== oldTier;

    // Create transaction
    const transaction: PointsTransaction = {
      id: `txn_${Date.now()}`,
      userId,
      type: 'earn',
      points: amount,
      balance: newBalance,
      reason,
      relatedId: bookingId,
      createdAt: new Date(),
    };

    // Update member
    // await prisma.loyaltyMember.update({
    //   where: { userId },
    //   data: {
    //     points: newBalance,
    //     lifetimePoints: newLifetimePoints,
    //     tier: newTier,
    //   },
    // });

    // If tier upgraded, send notification
    if (tierUpgraded) {
      logger.info(`User ${userId} upgraded from ${oldTier} to ${newTier}`);
      // Send notification via notifications service
    }

    logger.info(`Points awarded: ${transaction.id}`);

    return transaction;
  } catch (error: any) {
    logger.error('Error awarding points:', error);
    throw error;
  }
}

/**
 * Redeem points for reward
 */
export async function redeemPoints(
  userId: string,
  rewardId: string
): Promise<{ transaction: PointsTransaction; reward: Reward }> {
  try {
    logger.info(`User ${userId} redeeming reward ${rewardId}`);

    const member = await getLoyaltyMember(userId);
    const reward = await getReward(rewardId);

    // Check if user has enough points
    if (member.points < reward.pointsCost) {
      throw new Error('Insufficient points');
    }

    // Check tier requirement
    if (reward.tier && TIER_THRESHOLDS[reward.tier] > TIER_THRESHOLDS[member.tier]) {
      throw new Error(`Requires ${reward.tier} tier or higher`);
    }

    const newBalance = member.points - reward.pointsCost;

    // Create transaction
    const transaction: PointsTransaction = {
      id: `txn_${Date.now()}`,
      userId,
      type: 'redeem',
      points: -reward.pointsCost,
      balance: newBalance,
      reason: `Redeemed: ${reward.name}`,
      relatedId: rewardId,
      createdAt: new Date(),
    };

    // Update member
    // await prisma.loyaltyMember.update({
    //   where: { userId },
    //   data: { points: newBalance },
    // });

    logger.info(`Points redeemed: ${transaction.id}`);

    return { transaction, reward };
  } catch (error: any) {
    logger.error('Error redeeming points:', error);
    throw error;
  }
}

/**
 * Get available rewards
 */
export async function getAvailableRewards(userId?: string): Promise<Reward[]> {
  try {
    logger.info('Getting available rewards');

    // Mock rewards
    const rewards: Reward[] = [
      {
        id: 'reward_1',
        name: '$50 Travel Voucher',
        description: 'Use on any booking',
        pointsCost: 5000,
        type: 'voucher',
        value: 50,
        availableQuantity: 100,
      },
      {
        id: 'reward_2',
        name: 'Free Hotel Night',
        description: 'One free night at participating hotels',
        pointsCost: 15000,
        type: 'free_night',
        value: 150,
        availableQuantity: 50,
      },
      {
        id: 'reward_3',
        name: 'Flight Upgrade',
        description: 'Upgrade to business class',
        pointsCost: 20000,
        type: 'upgrade',
        value: 300,
        tier: LoyaltyTier.GOLD,
        availableQuantity: 20,
      },
      {
        id: 'reward_4',
        name: 'Airport Transfer',
        description: 'Complimentary airport transfer',
        pointsCost: 3000,
        type: 'experience',
        value: 40,
        availableQuantity: 200,
      },
    ];

    // Filter by user tier if provided
    if (userId) {
      const member = await getLoyaltyMember(userId);
      return rewards.filter(
        (r) => !r.tier || TIER_THRESHOLDS[r.tier] <= TIER_THRESHOLDS[member.tier]
      );
    }

    return rewards;
  } catch (error: any) {
    logger.error('Error getting rewards:', error);
    throw error;
  }
}

/**
 * Get specific reward
 */
async function getReward(rewardId: string): Promise<Reward> {
  const rewards = await getAvailableRewards();
  const reward = rewards.find((r) => r.id === rewardId);
  if (!reward) {
    throw new Error('Reward not found');
  }
  return reward;
}

/**
 * Get points history
 */
export async function getPointsHistory(
  userId: string,
  limit: number = 50
): Promise<PointsTransaction[]> {
  try {
    logger.info(`Getting points history for user ${userId}`);

    // Mock transactions
    const transactions: PointsTransaction[] = [
      {
        id: 'txn_1',
        userId,
        type: 'earn',
        points: 1500,
        balance: 30000,
        reason: 'Hotel booking',
        relatedId: 'booking_123',
        createdAt: new Date('2025-12-20'),
      },
      {
        id: 'txn_2',
        userId,
        type: 'redeem',
        points: -5000,
        balance: 28500,
        reason: 'Redeemed: $50 Travel Voucher',
        relatedId: 'reward_1',
        createdAt: new Date('2025-12-15'),
      },
      {
        id: 'txn_3',
        userId,
        type: 'earn',
        points: 2500,
        balance: 33500,
        reason: 'Flight booking',
        relatedId: 'booking_122',
        createdAt: new Date('2025-12-10'),
      },
    ];

    return transactions.slice(0, limit);
  } catch (error: any) {
    logger.error('Error getting points history:', error);
    throw error;
  }
}

/**
 * Calculate points for booking
 */
export function calculatePointsForBooking(
  totalAmount: number,
  tier: LoyaltyTier = LoyaltyTier.BRONZE
): number {
  // Base: 1 point per dollar
  let points = Math.floor(totalAmount);

  // Tier multipliers
  const multipliers = {
    [LoyaltyTier.BRONZE]: 1,
    [LoyaltyTier.SILVER]: 1.25,
    [LoyaltyTier.GOLD]: 1.5,
    [LoyaltyTier.PLATINUM]: 2,
    [LoyaltyTier.DIAMOND]: 3,
  };

  points *= multipliers[tier];

  return Math.floor(points);
}

/**
 * Apply tier discount to booking
 */
export function applyTierDiscount(amount: number, tier: LoyaltyTier): number {
  const discounts = {
    [LoyaltyTier.BRONZE]: 0.05,
    [LoyaltyTier.SILVER]: 0.1,
    [LoyaltyTier.GOLD]: 0.15,
    [LoyaltyTier.PLATINUM]: 0.2,
    [LoyaltyTier.DIAMOND]: 0.3,
  };

  const discount = amount * discounts[tier];
  return amount - discount;
}

/**
 * Check if user has specific benefit
 */
export function hasBenefit(
  member: LoyaltyMember,
  benefitType: LoyaltyBenefit['type']
): LoyaltyBenefit | null {
  return member.benefits.find((b) => b.type === benefitType) || null;
}

export default {
  getLoyaltyMember,
  awardPoints,
  redeemPoints,
  getAvailableRewards,
  getPointsHistory,
  calculatePointsForBooking,
  applyTierDiscount,
  hasBenefit,
};
