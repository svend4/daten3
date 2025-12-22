import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import { reviewService, ReviewType } from '../services/review.service.js';

/**
 * Create a new review
 * POST /api/reviews
 */
export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { type, entityId, rating, title, content, pros, cons, travelDate } = req.body;

    // Validation
    if (!type || !entityId || !rating || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, entityId, rating, title, content'
      });
    }

    const review = await reviewService.createReview({
      userId,
      type: type as ReviewType,
      entityId,
      rating: Number(rating),
      title,
      content,
      pros,
      cons,
      travelDate: travelDate ? new Date(travelDate) : undefined
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error: any) {
    logger.error('Error creating review', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get reviews for an entity
 * GET /api/reviews/:type/:entityId
 */
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { type, entityId } = req.params;
    const {
      page,
      limit,
      sortBy,
      minRating,
      verifiedOnly
    } = req.query;

    const result = await reviewService.getReviews(
      type as ReviewType,
      entityId,
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as 'recent' | 'helpful' | 'rating' | undefined,
        minRating: minRating ? Number(minRating) : undefined,
        verifiedOnly: verifiedOnly === 'true'
      }
    );

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination
    });
  } catch (error: any) {
    logger.error('Error fetching reviews', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get review statistics
 * GET /api/reviews/:type/:entityId/stats
 */
export const getReviewStats = async (req: Request, res: Response) => {
  try {
    const { type, entityId } = req.params;

    const stats = await reviewService.getReviewStats(
      type as ReviewType,
      entityId
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error fetching review stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark review as helpful/not helpful
 * POST /api/reviews/:reviewId/helpful
 */
export const markHelpful = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { helpful } = req.body;

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'helpful field must be a boolean'
      });
    }

    const review = await reviewService.markHelpful(reviewId, helpful);

    res.json({
      success: true,
      data: review
    });
  } catch (error: any) {
    logger.error('Error marking review helpful', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update review
 * PUT /api/reviews/:reviewId
 */
export const updateReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { reviewId } = req.params;
    const { rating, title, content, pros, cons } = req.body;

    const review = await reviewService.updateReview(
      reviewId,
      userId,
      { rating, title, content, pros, cons }
    );

    res.json({
      success: true,
      data: review
    });
  } catch (error: any) {
    logger.error('Error updating review', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete review
 * DELETE /api/reviews/:reviewId
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { reviewId } = req.params;

    await reviewService.deleteReview(reviewId, userId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting review', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user's reviews
 * GET /api/reviews/my-reviews
 */
export const getMyReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { page, limit } = req.query;

    const result = await reviewService.getUserReviews(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination
    });
  } catch (error: any) {
    logger.error('Error fetching user reviews', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
