import express from 'express';
import * as favoritesController from '../controllers/favorites.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  getFavoritesValidator,
  addFavoriteValidator,
  removeFavoriteValidator,
  checkFavoriteValidator,
} from '../validators/favorite.validators';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's favorites
router.get('/', getFavoritesValidator, validate, favoritesController.getFavorites);

// Add to favorites
router.post('/', addFavoriteValidator, validate, favoritesController.addFavorite);

// Remove from favorites
router.delete('/:id', removeFavoriteValidator, validate, favoritesController.removeFavorite);

// Check if item is favorited
router.get(
  '/check/:type/:itemId',
  checkFavoriteValidator,
  validate,
  favoritesController.checkFavorite
);

export default router;
