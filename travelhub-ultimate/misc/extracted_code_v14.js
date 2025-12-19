const logger = require('../utils/logger');

/**
 * Centralized error handler
 */
function errorHandler(err, req, res, next) {
  // Логирование ошибки
  logger.error('Error occurred', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Определить статус код
  const statusCode = err.statusCode || err.status || 500;

  // Базовый ответ
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  };

  // Специфичные ошибки
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.details || err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required or token invalid'
    });
  }

  if (err.code === 'ETIMEDOUT') {
    return res.status(504).json({
      success: false,
      error: 'Gateway timeout',
      message: 'External API request timed out'
    });
  }

  // Отправить ответ
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.url} not found`
  });
}

module.exports = { errorHandler, notFoundHandler };
