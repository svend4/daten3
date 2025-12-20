import { Request, Response } from 'express';

/**
 * Favorites Controller
 * Handles user favorites (hotels, flights, etc.)
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

    const { type } = req.query; // 'hotel', 'flight', etc.

    // TODO: Fetch from database
    // const favorites = await prisma.favorite.findMany({
    //   where: {
    //     userId: req.user.id,
    //     ...(type && { type })
    //   },
    //   include: {
    //     hotel: true,
    //     flight: true
    //   }
    // });

    // Mock data
    const mockFavorites = [
      {
        id: 'fav_1',
        userId: req.user.id,
        type: 'hotel',
        itemId: 'hotel_123',
        itemData: {
          name: 'Grand Hotel',
          location: 'Paris, France',
          rating: 4.8,
          price: 150
        },
        createdAt: '2024-12-10T10:00:00Z'
      }
    ];

    res.json({
      success: true,
      data: mockFavorites
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

    const { type, itemId, itemData } = req.body;

    if (!type || !itemId) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Type and item ID are required.'
      });
      return;
    }

    // TODO: Check if already favorited
    // const existing = await prisma.favorite.findFirst({
    //   where: { userId: req.user.id, itemId }
    // });

    // TODO: Create favorite
    // const favorite = await prisma.favorite.create({
    //   data: {
    //     userId: req.user.id,
    //     type,
    //     itemId,
    //     itemData
    //   }
    // });

    const mockFavorite = {
      id: 'fav_' + Date.now(),
      userId: req.user.id,
      type,
      itemId,
      itemData,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Item added to favorites',
      data: mockFavorite
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

    // TODO: Delete from database
    // await prisma.favorite.delete({
    //   where: {
    //     id,
    //     userId: req.user.id // Ensure user owns this favorite
    //   }
    // });

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

    // TODO: Check in database
    // const favorite = await prisma.favorite.findFirst({
    //   where: {
    //     userId: req.user.id,
    //     type,
    //     itemId
    //   }
    // });

    res.json({
      success: true,
      isFavorited: false, // Change to !!favorite when implemented
      data: null
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
