require('dotenv').config();
const express = require('express');
const compression = require('compression');
const { createRedisClient } = require('./config/redis.config');
const logger = require('./utils/logger');

// Middleware
const corsMiddleware = require('./middleware/cors.middleware');
const helmetMiddleware = require('./middleware/helmet.middleware');
const requestLogger = require('./middleware/logger.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler.middleware');
const { optionalAuth } = require('./middleware/auth.middleware');

// Routes
const routes = require('./routes');

// Создать Express приложение
const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security headers
app.use(helmetMiddleware);

// CORS
app.use(corsMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Optional authentication (для будущего)
app.use(optionalAuth);

// ============================================
// ROUTES
// ============================================

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TravelHub API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      flights: '/api/flights/search',
      hotels: '/api/hotels/search',
      cars: '/api/cars/search'
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Подключить Redis
    logger.info('Connecting to Redis...');
    await createRedisClient();
    logger.info('Redis connected successfully');

    // Запустить сервер
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Запустить сервер
startServer();

module.exports = app;
