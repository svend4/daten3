import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

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
app.post('/api/hotels/search', (req, res) => {
  const searchParams = req.body;
  console.log('Hotels search params:', searchParams);

  // TODO: Implement actual hotel search logic
  res.json({
    message: 'Hotels search endpoint',
    params: searchParams,
    hotels: [] // Empty for now, will be populated with real data later
  });
});

// Flights search endpoint - accepts POST with search params
app.post('/api/flights/search', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
