import cors from 'cors';

/**
 * CORS Middleware Configuration
 * Handles Cross-Origin Resource Sharing
 */

// Get allowed origins from environment
const getAllowedOrigins = (): string[] => {
  const frontendUrl = process.env.FRONTEND_URL;

  if (frontendUrl) {
    return frontendUrl.split(',').map(url => url.trim());
  }

  // Default origins for development
  return [
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
};

const allowedOrigins = getAllowedOrigins();

// CORS options
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

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

    // Block the request
    console.error(`❌ CORS blocked: ${origin}`);
    console.error(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    console.error(`   💡 Set FRONTEND_URL environment variable to: ${origin}`);

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
};

// Log CORS configuration on startup
console.log('🔧 CORS Configuration:');
console.log('  FRONTEND_URL env:', process.env.FRONTEND_URL || '❌ NOT SET');
console.log('  Allowed origins:', allowedOrigins);
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');

export default cors(corsOptions);
