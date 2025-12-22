import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';

// Load environment variables first
dotenv.config();

// Validate environment variables
import { validateAndLogEnv } from './config/env.validator.js';
validateAndLogEnv();

// Configuration
import { config } from './config/index.js';

// Swagger documentation
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config.js';

// Routes
import affiliateRoutes from './routes/affiliate.routes.js';
import authRoutes from './routes/auth.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import priceAlertsRoutes from './routes/priceAlerts.routes.js';
import adminRoutes from './routes/admin.routes.js';
import flightsRoutes from './routes/flights.routes.js';
import hotelsRoutes from './routes/hotels.routes.js';
import carsRoutes from './routes/cars.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import reviewRoutes from './routes/review.routes.js';
import currencyRoutes from './routes/currency.routes.js';
import reportRoutes from './routes/report.routes.js';
import healthRoutes from './routes/health.routes.js';
import recommendationsRoutes from './routes/recommendations.routes.js';
import loyaltyRoutes from './routes/loyalty.routes.js';
import groupBookingsRoutes from './routes/groupBookings.routes.js';
import payoutRoutes from './routes/payout.routes.js';
import cronRoutes from './routes/cron.routes.js';

// Middleware
import corsMiddleware from './middleware/cors.middleware.js';
import helmetMiddleware, { permissionsPolicy, expectCT } from './middleware/helmet.middleware.js';
import morganMiddleware, { requestLogger } from './middleware/logger.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.middleware.js';
import { rateLimiters } from './middleware/rateLimit.middleware.js';
import { trackAffiliateClick } from './middleware/affiliateTracking.middleware.js';
import requestIdMiddleware from './middleware/requestId.middleware.js';
import responseTimeMiddleware from './middleware/responseTime.middleware.js';

// Services
import { redisService } from './services/redis.service.js';
import { initializeCronJobs } from './services/cron.service.js';

// Utils
import logger from './utils/logger.js';

const app = express();
const PORT = config.server.port;

// Store HTTP server instance for graceful shutdown
let httpServer: any = null;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Request tracking middleware (must be first)
app.use(requestIdMiddleware);  // Assign unique ID to each request
app.use(responseTimeMiddleware); // Measure response time

// Security middleware
app.use(helmetMiddleware);
app.use(permissionsPolicy);  // Advanced Permissions-Policy header
app.use(expectCT);           // Certificate Transparency enforcement
app.use(corsMiddleware);

// Cookie parsing middleware (must be before routes)
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response compression (gzip/brotli)
app.use(compression({
  filter: (req, res) => {
    // Don't compress responses if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all responses
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, 6 is default and good balance)
  threshold: 1024, // Only compress responses larger than 1KB
}));

// Logging middleware
app.use(morganMiddleware);
app.use(requestLogger); // Enhanced logging for slow/failed requests

// Affiliate tracking middleware (track clicks and set cookies)
app.use(trackAffiliateClick);

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

// Health check routes (Railway, K8s probes, monitoring)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// ============================================
// API DOCUMENTATION (Swagger)
// ============================================

// Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TravelHub API Documentation',
}));

// Swagger JSON spec at /api-docs.json
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


// ===== API ROUTES =====

// Auth routes
app.use('/api/auth', authRoutes);

// Affiliate routes
app.use('/api/affiliate', affiliateRoutes);

// User routes
app.use('/api/bookings', bookingsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/price-alerts', priceAlertsRoutes);
app.use('/api/flights', flightsRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationsRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Currency routes
app.use('/api/currency', currencyRoutes);

// Report routes
app.use('/api/reports', reportRoutes);

// Recommendations routes
app.use('/api/recommendations', recommendationsRoutes);

// Loyalty program routes
app.use('/api/loyalty', loyaltyRoutes);

// Group bookings routes
app.use('/api/group-bookings', groupBookingsRoutes);

// Payout routes
app.use('/api/payouts', payoutRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Cron job management routes (admin only)
app.use('/api/admin/cron', cronRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TravelHub Ultimate API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      hotels: '/api/hotels/search',
      flights: '/api/flights',
      cars: '/api/cars',
      payment: '/api/payment',
      notifications: '/api/notifications',
      analytics: '/api/analytics',
      affiliate: '/api/affiliate',
      bookings: '/api/bookings',
      favorites: '/api/favorites',
      priceAlerts: '/api/price-alerts',
      reviews: '/api/reviews',
      currency: '/api/currency',
      reports: '/api/reports',
      recommendations: '/api/recommendations',
      loyalty: '/api/loyalty',
      groupBookings: '/api/group-bookings',
      payouts: '/api/payouts',
      admin: '/api/admin'
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

// Initialize services before starting server
async function startServer() {
  try {
    // Connect to Redis
    await redisService.connect();

    // Initialize cron jobs for automated tasks
    initializeCronJobs();

    // Start HTTP server and store instance
    httpServer = app.listen(PORT, () => {
      logger.info('═══════════════════════════════════════════════════');
      logger.info('🚀 TravelHub Ultimate API Server');
      logger.info('═══════════════════════════════════════════════════');
      logger.info(`📍 Port: ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('');
      logger.info('📚 API Documentation:');
      logger.info(`   Swagger UI:   http://localhost:${PORT}/api-docs`);
      logger.info('');
      logger.info('📡 API Endpoints:');
      logger.info(`   Auth:          http://localhost:${PORT}/api/auth`);
      logger.info(`   Hotels:        http://localhost:${PORT}/api/hotels/search`);
      logger.info(`   Flights:       http://localhost:${PORT}/api/flights`);
      logger.info(`   Payment:       http://localhost:${PORT}/api/payment`);
      logger.info(`   Notifications: http://localhost:${PORT}/api/notifications`);
      logger.info(`   Analytics:     http://localhost:${PORT}/api/analytics`);
      logger.info(`   Affiliate:     http://localhost:${PORT}/api/affiliate`);
      logger.info(`   Bookings:      http://localhost:${PORT}/api/bookings`);
      logger.info(`   Favorites:     http://localhost:${PORT}/api/favorites`);
      logger.info(`   Price Alerts:  http://localhost:${PORT}/api/price-alerts`);
      logger.info(`   Reviews:       http://localhost:${PORT}/api/reviews`);
      logger.info(`   Currency:      http://localhost:${PORT}/api/currency`);
      logger.info(`   Reports:       http://localhost:${PORT}/api/reports`);
      logger.info(`   Recommendations: http://localhost:${PORT}/api/recommendations`);
      logger.info(`   Loyalty:       http://localhost:${PORT}/api/loyalty`);
      logger.info(`   Group Bookings: http://localhost:${PORT}/api/group-bookings`);
      logger.info(`   Payouts:       http://localhost:${PORT}/api/payouts`);
      logger.info(`   Admin:         http://localhost:${PORT}/api/admin`);
      logger.info('');
      logger.info('✅ Server is ready to accept connections');
      logger.info('═══════════════════════════════════════════════════');
    });
  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Graceful shutdown handler
 * Ensures all connections are closed properly before exit
 */
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, initiating graceful shutdown...`);

  // Set shutdown timeout (30 seconds)
  const shutdownTimeout = setTimeout(() => {
    logger.error('Shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 30000);

  try {
    // Step 1: Stop accepting new connections
    if (httpServer) {
      logger.info('Closing HTTP server...');
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err: any) => {
          if (err) {
            logger.error('Error closing HTTP server:', err);
            reject(err);
          } else {
            logger.info('✓ HTTP server closed');
            resolve();
          }
        });
      });
    }

    // Step 2: Disconnect from Redis
    logger.info('Disconnecting from Redis...');
    await redisService.disconnect();
    logger.info('✓ Redis disconnected');

    // Step 3: Disconnect from Prisma
    logger.info('Disconnecting from Prisma...');
    await prisma.$disconnect();
    logger.info('✓ Prisma disconnected');

    // Step 4: Clear shutdown timeout
    clearTimeout(shutdownTimeout);

    logger.info('✅ Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  logger.error('Stack:', error.stack);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  gracefulShutdown('unhandledRejection');
});
