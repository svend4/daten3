import cors from 'cors';
import { config } from '../config/index.js';

/**
 * CORS Middleware Configuration
 * Handles Cross-Origin Resource Sharing with httpOnly cookies support
 */

const allowedOrigins = config.cors.origin;

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
  credentials: config.cors.credentials, // Required for httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token', // CSRF protection
    'X-API-Key'
  ],
  exposedHeaders: [
    'Content-Length',
    'X-Request-Id',
    'Set-Cookie',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400, // 24 hours
};

// Log CORS configuration on startup
console.log('🔧 CORS Configuration:');
console.log('  FRONTEND_URL env:', process.env.FRONTEND_URL || '❌ NOT SET');
console.log('  Allowed origins:', allowedOrigins);
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');

export default cors(corsOptions);
