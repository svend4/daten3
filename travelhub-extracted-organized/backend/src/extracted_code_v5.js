const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites.controller');
const { authenticate } = require('../middleware/auth.middleware');

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

module.exports = router;
