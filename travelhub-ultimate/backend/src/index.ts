import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import affiliateRoutes from './routes/affiliate.routes';
import authRoutes from './routes/auth.routes';
import bookingsRoutes from './routes/bookings.routes';
import favoritesRoutes from './routes/favorites.routes';
import priceAlertsRoutes from './routes/priceAlerts.routes';
import adminRoutes from './routes/admin.routes';
import { rateLimiters } from './middleware/rateLimit.middleware';
import { searchHotels } from './services/travelpayouts.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3001', 'http://localhost:5173'];

// Log CORS configuration on startup
console.log('🔧 CORS Configuration:');
console.log('  FRONTEND_URL env:', process.env.FRONTEND_URL || '❌ NOT SET');
console.log('  Allowed origins:', allowedOrigins);
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      console.log(`✅ CORS allowed: ${origin}`);
      return callback(null, true);
    }

    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      console.log(`✅ CORS allowed (dev localhost): ${origin}`);
      return callback(null, true);
    }

    console.error(`❌ CORS blocked: ${origin}`);
    console.error(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    console.error(`   💡 Set FRONTEND_URL environment variable to: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoints (Railway checks /api/health)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Hotels search endpoint - accepts POST with search params
app.post('/api/hotels/search', rateLimiters.moderate, async (req, res) => {
  try {
    const searchParams = req.body;
    console.log('🔍 Hotels search params:', searchParams);

    // Search hotels using Travelpayouts API
    const results = await searchHotels({
      destination: searchParams.destination || searchParams.city,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      adults: searchParams.adults || searchParams.guests || 2,
      rooms: searchParams.rooms || 1
    });

    res.json({
      success: true,
      message: 'Hotels search successful',
      data: results
    });
  } catch (error: any) {
    console.error('❌ Hotels search error:', error);
    res.status(500).json({
      success: false,
      error: 'Hotel search failed',
      message: error.message
    });
  }
});

// Flights search endpoint - accepts POST with search params
app.post('/api/flights/search', rateLimiters.moderate, (req, res) => {
  const searchParams = req.body;
  console.log('Flights search params:', searchParams);

  // TODO: Implement actual flight search logic
  res.json({
    message: 'Flights search endpoint',
    params: searchParams,
    flights: [] // Empty for now, will be populated with real data later
  });
});

// Keep GET endpoints for manual testing
app.get('/api/hotels/search', (req, res) => {
  res.json({ message: 'Hotels search endpoint (use POST with params)' });
});

app.get('/api/flights/search', (req, res) => {
  res.json({ message: 'Flights search endpoint (use POST with params)' });
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

// Admin routes
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TravelHub Ultimate API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      hotels: '/api/hotels/search',
      flights: '/api/flights/search',
      affiliate: '/api/affiliate',
      bookings: '/api/bookings',
      favorites: '/api/favorites',
      priceAlerts: '/api/price-alerts',
      admin: '/api/admin'
    }
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 TravelHub Ultimate API Server');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📡 API Endpoints:');
  console.log(`   Auth:         http://localhost:${PORT}/api/auth`);
  console.log(`   Hotels:       http://localhost:${PORT}/api/hotels/search`);
  console.log(`   Flights:      http://localhost:${PORT}/api/flights/search`);
  console.log(`   Affiliate:    http://localhost:${PORT}/api/affiliate`);
  console.log(`   Bookings:     http://localhost:${PORT}/api/bookings`);
  console.log(`   Favorites:    http://localhost:${PORT}/api/favorites`);
  console.log(`   Price Alerts: http://localhost:${PORT}/api/price-alerts`);
  console.log(`   Admin:        http://localhost:${PORT}/api/admin`);
  console.log('');
  console.log('✅ Server is ready to accept connections');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});
