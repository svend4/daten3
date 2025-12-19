const logger = require('../utils/logger');

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Логировать запрос
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id
  });

  // Перехватить окончание ответа
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  });

  next();
}

module.exports = requestLogger;
