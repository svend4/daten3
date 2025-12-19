const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get user's favorites
 */
exports.getFavorites = async (req, res) => {
  try {
    const { type } = req.query; // Optional filter by type

    const where = {
      userId: req.user.id,
      ...(type && { type }),
    };

    const favorites = await prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: favorites.length,
      data: favorites,
    });
  } catch (error) {
    logger.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get favorites',
      message: error.message,
    });
  }
};

/**
 * Add to favorites
 */
exports.addFavorite = async (req, res) => {
  try {
    const { type, itemId, itemData } = req.body;

    if (!type || !itemId || !itemData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_type_itemId: {
          userId: req.user.id,
          type,
          itemId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Item already in favorites',
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.id,
        type,
        itemId,
        itemData,
      },
    });

    logger.info('Favorite added', { userId: req.user.id, favoriteId: favorite.id });

    res.status(201).json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    logger.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add favorite',
      message: error.message,
    });
  }
};

/**
 * Remove from favorites
 */
exports.removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const favorite = await prisma.favorite.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Favorite not found',
      });
    }

    await prisma.favorite.delete({
      where: { id },
    });

    logger.info('Favorite removed', { userId: req.user.id, favoriteId: id });

    res.json({
      success: true,
      message: 'Favorite removed successfully',
    });
  } catch (error) {
    logger.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove favorite',
      message: error.message,
    });
  }
};

/**
 * Check if item is favorited
 */
exports.checkFavorite = async (req, res) => {
  try {
    const { type, itemId } = req.params;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_type_itemId: {
          userId: req.user.id,
          type,
          itemId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        isFavorited: !!favorite,
        favoriteId: favorite?.id,
      },
    });
  } catch (error) {
    logger.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check favorite',
      message: error.message,
    });
  }
};
