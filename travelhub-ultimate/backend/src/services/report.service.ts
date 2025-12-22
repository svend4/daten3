/**
 * Report Generation Service
 * Generate analytics and business reports for admins and affiliates
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Report types
 */
export enum ReportType {
  REVENUE = 'revenue',
  BOOKINGS = 'bookings',
  AFFILIATES = 'affiliates',
  USERS = 'users',
  COMMISSIONS = 'commissions',
  PERFORMANCE = 'performance'
}

/**
 * Date range for reports
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Revenue report data
 */
interface RevenueReport {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  revenueByType: {
    type: string;
    revenue: number;
    bookings: number;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
    bookings: number;
  }[];
  topDestinations: {
    destination: string;
    revenue: number;
    bookings: number;
  }[];
}

/**
 * Affiliate performance report
 */
interface AffiliateReport {
  affiliateId: string;
  affiliateName: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  conversionRate: number;
  averageCommissionPerReferral: number;
  topReferrals: {
    userId: string;
    userName: string;
    bookings: number;
    totalSpent: number;
    commissionsGenerated: number;
  }[];
}

/**
 * User statistics report
 */
interface UserReport {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  usersByRole: {
    role: string;
    count: number;
  }[];
  userGrowth: {
    date: string;
    newUsers: number;
    totalUsers: number;
  }[];
  topSpenders: {
    userId: string;
    userName: string;
    totalSpent: number;
    bookings: number;
  }[];
}

/**
 * Report Service
 */
class ReportService {
  /**
   * Generate revenue report
   */
  async generateRevenueReport(dateRange: DateRange): Promise<RevenueReport> {
    try {
      const { startDate, endDate } = dateRange;

      // Get all bookings in date range
      const bookings = await prisma.booking.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: {
            in: ['confirmed', 'completed']
          }
        },
        select: {
          id: true,
          type: true,
          totalPrice: true,
          currency: true,
          itemName: true,
          createdAt: true
        }
      });

      // Calculate total revenue (assuming all in USD for simplicity)
      const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const totalBookings = bookings.length;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Revenue by type
      const revenueByType: { [key: string]: { revenue: number; bookings: number } } = {};
      bookings.forEach(b => {
        if (!revenueByType[b.type]) {
          revenueByType[b.type] = { revenue: 0, bookings: 0 };
        }
        revenueByType[b.type].revenue += b.totalPrice;
        revenueByType[b.type].bookings += 1;
      });

      // Revenue by day
      const revenueByDay: { [key: string]: { revenue: number; bookings: number } } = {};
      bookings.forEach(b => {
        const date = b.createdAt.toISOString().split('T')[0];
        if (!revenueByDay[date]) {
          revenueByDay[date] = { revenue: 0, bookings: 0 };
        }
        revenueByDay[date].revenue += b.totalPrice;
        revenueByDay[date].bookings += 1;
      });

      // Top destinations (using itemName as destination)
      const destinationStats: { [key: string]: { revenue: number; bookings: number } } = {};
      bookings.forEach(b => {
        const destination = b.itemName || 'Unknown';
        if (!destinationStats[destination]) {
          destinationStats[destination] = { revenue: 0, bookings: 0 };
        }
        destinationStats[destination].revenue += b.totalPrice;
        destinationStats[destination].bookings += 1;
      });

      const topDestinations = Object.entries(destinationStats)
        .map(([destination, stats]) => ({ destination, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        averageBookingValue: Math.round(averageBookingValue * 100) / 100,
        revenueByType: Object.entries(revenueByType).map(([type, stats]) => ({
          type,
          revenue: Math.round(stats.revenue * 100) / 100,
          bookings: stats.bookings
        })),
        revenueByDay: Object.entries(revenueByDay)
          .map(([date, stats]) => ({
            date,
            revenue: Math.round(stats.revenue * 100) / 100,
            bookings: stats.bookings
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        topDestinations: topDestinations.map(d => ({
          ...d,
          revenue: Math.round(d.revenue * 100) / 100
        }))
      };
    } catch (error: any) {
      logger.error('Error generating revenue report', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate affiliate performance report
   */
  async generateAffiliateReport(
    affiliateId: string,
    dateRange: DateRange
  ): Promise<AffiliateReport> {
    try {
      const { startDate, endDate } = dateRange;

      // Get affiliate user
      const affiliate = await prisma.user.findUnique({
        where: { id: affiliateId },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      });

      if (!affiliate) {
        throw new Error('Affiliate not found');
      }

      // Get all referrals (using affiliateId instead of referrerId)
      const referrals = await prisma.referral.findMany({
        where: { affiliateId: affiliateId }
      });

      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.status === 'active').length;

      // Get commissions in date range
      const commissions = await prisma.commission.findMany({
        where: {
          affiliateId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
      const paidCommissions = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0);
      const pendingCommissions = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0);

      // Get bookings from referred affiliates (if they exist)
      const referralIds = referrals
        .map(r => r.referredAffiliateId)
        .filter((id): id is string => id !== null);
      const bookings = await prisma.booking.findMany({
        where: {
          userId: { in: referralIds },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const conversionRate = totalReferrals > 0
        ? (bookings.length / totalReferrals) * 100
        : 0;

      const averageCommissionPerReferral = totalReferrals > 0
        ? totalCommissions / totalReferrals
        : 0;

      // Top referrals
      const referralStats = await Promise.all(
        referralIds.slice(0, 10).map(async (userId) => {
          const userBookings = await prisma.booking.findMany({
            where: {
              userId,
              createdAt: { gte: startDate, lte: endDate }
            }
          });

          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true }
          });

          const userCommissions = await prisma.commission.findMany({
            where: {
              affiliateId,
              bookingId: { in: userBookings.map(b => b.id) }
            }
          });

          return {
            userId,
            userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            bookings: userBookings.length,
            totalSpent: userBookings.reduce((sum, b) => sum + b.totalPrice, 0),
            commissionsGenerated: userCommissions.reduce((sum, c) => sum + c.amount, 0)
          };
        })
      );

      const topReferrals = referralStats
        .sort((a, b) => b.commissionsGenerated - a.commissionsGenerated)
        .slice(0, 10);

      return {
        affiliateId,
        affiliateName: `${affiliate.firstName} ${affiliate.lastName}`,
        totalReferrals,
        activeReferrals,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        paidCommissions: Math.round(paidCommissions * 100) / 100,
        pendingCommissions: Math.round(pendingCommissions * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageCommissionPerReferral: Math.round(averageCommissionPerReferral * 100) / 100,
        topReferrals: topReferrals.map(r => ({
          ...r,
          totalSpent: Math.round(r.totalSpent * 100) / 100,
          commissionsGenerated: Math.round(r.commissionsGenerated * 100) / 100
        }))
      };
    } catch (error: any) {
      logger.error('Error generating affiliate report', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate user statistics report
   */
  async generateUserReport(dateRange: DateRange): Promise<UserReport> {
    try {
      const { startDate, endDate } = dateRange;

      // Total users
      const totalUsers = await prisma.user.count();

      // New users in date range
      const newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Active users (users with bookings in date range)
      const activeUsersResult = await prisma.booking.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      });

      const activeUsers = activeUsersResult.length;

      // Users by role
      const usersByRoleResult = await prisma.user.groupBy({
        by: ['role'],
        _count: true
      });

      const usersByRole = usersByRoleResult.map(r => ({
        role: r.role,
        count: r._count
      }));

      // User growth (daily new users)
      const allUsers = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const userGrowthByDay: { [key: string]: number } = {};
      allUsers.forEach(u => {
        const date = u.createdAt.toISOString().split('T')[0];
        userGrowthByDay[date] = (userGrowthByDay[date] || 0) + 1;
      });

      let cumulativeUsers = totalUsers - newUsers;
      const userGrowth = Object.entries(userGrowthByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, newUsers]) => {
          cumulativeUsers += newUsers;
          return {
            date,
            newUsers,
            totalUsers: cumulativeUsers
          };
        });

      // Top spenders
      const topSpendersResult = await prisma.booking.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: {
            in: ['confirmed', 'completed']
          }
        },
        _sum: {
          totalPrice: true
        },
        _count: true
      });

      const topSpenders = await Promise.all(
        topSpendersResult
          .sort((a, b) => (b._sum.totalPrice || 0) - (a._sum.totalPrice || 0))
          .slice(0, 10)
          .map(async (result) => {
            const user = await prisma.user.findUnique({
              where: { id: result.userId },
              select: { firstName: true, lastName: true }
            });

            return {
              userId: result.userId,
              userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
              totalSpent: Math.round((result._sum.totalPrice || 0) * 100) / 100,
              bookings: result._count
            };
          })
      );

      return {
        totalUsers,
        newUsers,
        activeUsers,
        usersByRole,
        userGrowth,
        topSpenders
      };
    } catch (error: any) {
      logger.error('Error generating user report', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate quick summary report
   */
  async generateSummary(dateRange: DateRange) {
    try {
      const { startDate, endDate } = dateRange;

      const [
        totalBookings,
        totalRevenue,
        totalUsers,
        totalCommissions
      ] = await Promise.all([
        prisma.booking.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { in: ['confirmed', 'completed'] }
          }
        }),
        prisma.booking.aggregate({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { in: ['confirmed', 'completed'] }
          },
          _sum: { totalPrice: true }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.commission.aggregate({
          where: {
            createdAt: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true }
        })
      ]);

      return {
        dateRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        totalBookings,
        totalRevenue: Math.round((totalRevenue._sum.totalPrice || 0) * 100) / 100,
        averageBookingValue: totalBookings > 0
          ? Math.round(((totalRevenue._sum.totalPrice || 0) / totalBookings) * 100) / 100
          : 0,
        newUsers: totalUsers,
        totalCommissions: Math.round((totalCommissions._sum.amount || 0) * 100) / 100
      };
    } catch (error: any) {
      logger.error('Error generating summary report', { error: error.message });
      throw error;
    }
  }
}

export const reportService = new ReportService();
