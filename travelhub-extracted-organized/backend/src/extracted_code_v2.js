const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getClient } = require('../config/redis.config');
const logger = require('../utils/logger');

/**
 * Создать rate limiter middleware
 */
function createRateLimiter(maxRequests, windowSeconds, options = {}) {
  const redisClient = getClient();

  const limiter = rateLimit({
    // Redis store для распределённого rate limiting
    store: redisClient ? new RedisStore({
      client: redisClient,
      prefix: 'rl:',
      sendCommand: (...args) => redisClient.sendCommand(args)
    }) : undefined,

    // Настройки лимита
    windowMs: windowSeconds * 1000,
    max: maxRequests,
    
    // Стандартизированные заголовки
    standardHeaders: true,
    legacyHeaders: false,

    // Сообщение при превышении лимита
    message: {
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds} seconds.`,
      retryAfter: windowSeconds
    },

    // Обработчик при превышении
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        limit: maxRequests,
        window: windowSeconds
      });

      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${windowSeconds} seconds.`,
        retryAfter: windowSeconds
      });
    },

    // Skip для определённых условий
    skip: (req) => {
      // Пропустить health check
      if (req.path === '/api/health') {
        return true;
      }

      // Пропустить для whitelisted IPs (если настроено)
      const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
      if (whitelist.includes(req.ip)) {
        return true;
      }

      return false;
    },

    // Ключ для идентификации пользователя
    keyGenerator: (req) => {
      // Использовать user ID если авторизован, иначе IP
      return req.user?.id || req.ip;
    },

    ...options
  });

  return limiter;
}

/**
 * Различные уровни rate limiting
 */
const rateLimiters = {
  // Строгий - для ресурсоёмких операций
  strict: createRateLimiter(5, 60, {
    message: 'Rate limit exceeded. This endpoint allows only 5 requests per minute.'
  }),

  // Средний - для обычных API запросов
  moderate: createRateLimiter(10, 60),

  // Мягкий - для лёгких операций
  lenient: createRateLimiter(30, 60),

  // Очень мягкий - для статичных данных
  veryLenient: createRateLimiter(100, 60)
};

// Экспорт функции и предустановленных лимитов
module.exports = createRateLimiter;
module.exports.rateLimiters = rateLimiters;
