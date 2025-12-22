const express = require('express');
const router = express.Router();

const flightsRoutes = require('./flights.routes');
const hotelsRoutes = require('./hotels.routes');
const carsRoutes = require('./cars.routes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
router.use('/flights', flightsRoutes);
router.use('/hotels', hotelsRoutes);
router.use('/cars', carsRoutes);

module.exports = router;
