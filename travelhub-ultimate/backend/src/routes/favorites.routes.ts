import express from 'express';
import * as favoritesController from '../controllers/favorites.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's favorites
router.get('/', favoritesController.getFavorites);

// Add to favorites
router.post('/', favoritesController.addFavorite);

// Remove from favorites
router.delete('/:id', favoritesController.removeFavorite);

// Check if item is favorited
router.get('/check/:type/:itemId', favoritesController.checkFavorite);

export default router;
