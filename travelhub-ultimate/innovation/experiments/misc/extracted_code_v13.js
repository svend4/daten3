const cors = require('cors');

/**
 * CORS конфигурация
 */
const corsOptions = {
  // Разрешённые origins
  origin: (origin, callback) => {
    // Список разрешённых origins
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourdomain.com'
    ];

    // Разрешить запросы без origin (например, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Разрешённые HTTP методы
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

  // Разрешённые заголовки
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Requested-With'
  ],

  // Заголовки, которые можно читать
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],

  // Разрешить credentials (cookies, authorization headers)
  credentials: true,

  // Preflight request cache (24 hours)
  maxAge: 86400
};

module.exports = cors(corsOptions);
