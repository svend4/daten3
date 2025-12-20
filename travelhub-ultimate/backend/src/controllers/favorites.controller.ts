import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

/**
 * Favorites Controller
 * Handles user favorites (hotels, flights, destinations)
 * Now using Prisma ORM with PostgreSQL
 */

/**
 * GET /api/favorites
 * Get all favorites for current user
 */
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const { type } = req.query;

    // Build filter conditions
    const where: any = {
      userId: req.user.id
    };

    if (type) {
      where.type = type;
    }

    // Fetch favorites from database
    const favorites = await prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        type: true,
        itemId: true,
        name: true,
        location: true,
        price: true,
        currency: true,
        image: true,
        rating: true,
        metadata: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: favorites,
      total: favorites.length
    });
  } catch (error: any) {
    console.error('❌ Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve favorites.'
    });
  }
};

/**
 * POST /api/favorites
 * Add item to favorites
 */
export const addFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const {
      type,
      itemId,
      name,
      location,
      price,
      currency,
      image,
      rating,
      metadata
    } = req.body;

    // Validation
    if (!type || !itemId || !name) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Type, item ID, and name are required.'
      });
      return;
    }

    // Validate type
    const validTypes = ['hotel', 'flight', 'destination'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
      return;
    }

    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: {
        userId: req.user.id,
        type,
        itemId
      }
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Already favorited',
        message: 'This item is already in your favorites.'
      });
      return;
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.id,
        type,
        itemId,
        name,
        location: location || null,
        price: price || null,
        currency: currency || null,
        image: image || null,
        rating: rating || null,
        metadata: metadata || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Item added to favorites',
      data: favorite
    });
  } catch (error: any) {
    console.error('❌ Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to add favorite.'
    });
  }
};

/**
 * DELETE /api/favorites/:id
 * Remove item from favorites
 */
export const removeFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const { id } = req.params;

    // Check if favorite exists and belongs to user
    const favorite = await prisma.favorite.findUnique({
      where: { id }
    });

    if (!favorite) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Favorite not found.'
      });
      return;
    }

    if (favorite.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to remove this favorite.'
      });
      return;
    }

    // Delete from database
    await prisma.favorite.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Item removed from favorites'
    });
  } catch (error: any) {
    console.error('❌ Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to remove favorite.'
    });
  }
};

/**
 * GET /api/favorites/check/:type/:itemId
 * Check if item is favorited
 */
export const checkFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const { type, itemId } = req.params;

    // Check in database
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: req.user.id,
        type,
        itemId
      }
    });

    res.json({
      success: true,
      isFavorited: !!favorite,
      data: favorite || null
    });
  } catch (error: any) {
    console.error('❌ Check favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to check favorite status.'
    });
  }
};
