const express = require('express');
const router = express.Router();
const flightsController = require('../controllers/flights.controller');
const rateLimitMiddleware = require('../middleware/rateLimit.middleware');

// Поиск авиабилетов
router.get(
  '/search',
  rateLimitMiddleware(10, 60), // 10 запросов в минуту
  flightsController.searchFlights
);

// Детали рейса
router.get(
  '/:id',
  rateLimitMiddleware(20, 60),
  flightsController.getFlightDetails
);

// Популярные направления
router.get(
  '/popular/destinations',
  rateLimitMiddleware(30, 60),
  flightsController.getPopularDestinations
);

module.exports = router;
