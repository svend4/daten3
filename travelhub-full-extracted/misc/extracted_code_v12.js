const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Опциональная аутентификация (для будущего расширения)
 */
exports.optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // Нет токена - пропускаем как анонимного
      req.user = null;
      return next();
    }

    // Проверить токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    // Невалидный токен - всё равно пропускаем
    req.user = null;
    next();
  }
};

/**
 * Обязательная аутентификация
 */
exports.requireAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid access token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'The provided token is invalid or expired'
    });
  }
};

/**
 * API Key аутентификация (для партнёрского доступа)
 */
exports.requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      message: 'Please provide an API key in X-API-Key header'
    });
  }

  // Проверить API ключ (в production - из базы данных)
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key attempt', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  req.apiKey = apiKey;
  next();
};
