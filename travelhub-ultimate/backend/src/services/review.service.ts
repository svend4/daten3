/**
 * Review & Rating Service
 * Handles reviews and ratings for hotels, flights, and other travel services
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Review types
 */
export enum ReviewType {
  HOTEL = 'hotel',
  FLIGHT = 'flight',
  CAR_RENTAL = 'car_rental',
  EXPERIENCE = 'experience'
}

/**
 * Review data interface
 */
export interface ReviewData {
  userId: string;
  type: ReviewType;
  entityId: string; // Hotel ID, Flight ID, etc.
  rating: number; // 1-5
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  travelDate?: Date;
  isVerified?: boolean;
}

/**
 * Review statistics
 */
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
  verifiedReviewsCount: number;
  recommendationRate: number;
}

/**
 * Review Service
 */
class ReviewService {
  /**
   * Create a new review
   */
  async createReview(data: ReviewData) {
    try {
      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user already reviewed this entity
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: data.userId,
          type: data.type,
          entityId: data.entityId
        }
      });

      if (existingReview) {
        throw new Error('You have already reviewed this item');
      }

      // Create review
      const review = await prisma.review.create({
        data: {
          userId: data.userId,
          type: data.type,
          entityId: data.entityId,
          rating: data.rating,
          title: data.title,
          content: data.content,
          pros: data.pros || [],
          cons: data.cons || [],
          travelDate: data.travelDate,
          isVerified: data.isVerified || false,
          helpful: 0,
          notHelpful: 0
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      logger.info('Review created', {
        reviewId: review.id,
        userId: data.userId,
        type: data.type,
        rating: data.rating
      });

      return review;
    } catch (error: any) {
      logger.error('Error creating review', { error: error.message });
      throw error;
    }
  }

  /**
   * Get reviews for an entity
   */
  async getReviews(type: ReviewType, entityId: string, options: {
    page?: number;
    limit?: number;
    sortBy?: 'recent' | 'helpful' | 'rating';
    minRating?: number;
    verifiedOnly?: boolean;
  } = {}) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        type,
        entityId
      };

      if (options.minRating) {
        where.rating = { gte: options.minRating };
      }

      if (options.verifiedOnly) {
        where.isVerified = true;
      }

      // Build orderBy clause
      let orderBy: any = {};
      switch (options.sortBy) {
        case 'helpful':
          orderBy = { helpful: 'desc' };
          break;
        case 'rating':
          orderBy = { rating: 'desc' };
          break;
        case 'recent':
        default:
          orderBy = { createdAt: 'desc' };
      }

      // Get reviews
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }),
        prisma.review.count({ where })
      ]);

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Error fetching reviews', { error: error.message });
      throw error;
    }
  }

  /**
   * Get review statistics for an entity
   */
  async getReviewStats(type: ReviewType, entityId: string): Promise<ReviewStats> {
    try {
      const reviews = await prisma.review.findMany({
        where: { type, entityId },
        select: {
          rating: true,
          isVerified: true
        }
      });

      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verifiedReviewsCount: 0,
          recommendationRate: 0
        };
      }

      // Calculate statistics
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;

      const ratingDistribution: { [key: number]: number } = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };

      reviews.forEach(r => {
        ratingDistribution[r.rating]++;
      });

      const verifiedReviewsCount = reviews.filter(r => r.isVerified).length;
      const positiveReviews = reviews.filter(r => r.rating >= 4).length;
      const recommendationRate = (positiveReviews / reviews.length) * 100;

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        ratingDistribution,
        verifiedReviewsCount,
        recommendationRate: Math.round(recommendationRate)
      };
    } catch (error: any) {
      logger.error('Error calculating review stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Update review helpfulness
   */
  async markHelpful(reviewId: string, helpful: boolean) {
    try {
      const field = helpful ? 'helpful' : 'notHelpful';

      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          [field]: { increment: 1 }
        }
      });

      logger.info('Review marked as helpful/not helpful', {
        reviewId,
        helpful
      });

      return review;
    } catch (error: any) {
      logger.error('Error updating review helpfulness', { error: error.message });
      throw error;
    }
  }

  /**
   * Update review
   */
  async updateReview(reviewId: string, userId: string, updates: {
    rating?: number;
    title?: string;
    content?: string;
    pros?: string[];
    cons?: string[];
  }) {
    try {
      // Verify ownership
      const existingReview = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!existingReview) {
        throw new Error('Review not found');
      }

      if (existingReview.userId !== userId) {
        throw new Error('You can only update your own reviews');
      }

      // Validate rating if provided
      if (updates.rating && (updates.rating < 1 || updates.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Update review
      const review = await prisma.review.update({
        where: { id: reviewId },
        data: updates,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logger.info('Review updated', { reviewId, userId });

      return review;
    } catch (error: any) {
      logger.error('Error updating review', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string, userId: string) {
    try {
      // Verify ownership
      const existingReview = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!existingReview) {
        throw new Error('Review not found');
      }

      if (existingReview.userId !== userId) {
        throw new Error('You can only delete your own reviews');
      }

      // Delete review
      await prisma.review.delete({
        where: { id: reviewId }
      });

      logger.info('Review deleted', { reviewId, userId });

      return { success: true };
    } catch (error: any) {
      logger.error('Error deleting review', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user's reviews
   */
  async getUserReviews(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.review.count({ where: { userId } })
      ]);

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Error fetching user reviews', { error: error.message });
      throw error;
    }
  }
}

export const reviewService = new ReviewService();
