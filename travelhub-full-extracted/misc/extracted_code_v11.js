const travelpayoutsService = require('../services/api/travelpayouts.service');
const { validateFlightSearch } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Поиск авиабилетов
 */
exports.searchFlights = async (req, res, next) => {
  try {
    const { origin, destination, departDate, returnDate, adults } = req.query;
    
    // Валидация входных данных
    const validation = validateFlightSearch(req.query);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Поиск авиабилетов
    const results = await travelpayoutsService.searchFlights({
      origin: validation.data.origin,
      destination: validation.data.destination,
      departure_at: validation.data.departDate,
      return_at: validation.data.returnDate,
      adults: validation.data.adults
    });

    // Логирование для аналитики
    logger.info('Flight search completed', {
      userId: req.user?.id || 'anonymous',
      query: { origin, destination, departDate },
      resultsCount: results.length,
      timestamp: new Date().toISOString()
    });

    // Ответ
    res.json({
      success: true,
      count: results.length,
      data: results,
      cached: req.fromCache || false
    });

  } catch (error) {
    logger.error('Flight search error:', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });
    
    next(error);
  }
};

/**
 * Получить детали рейса
 */
exports.getFlightDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement flight details retrieval
    
    res.json({
      success: true,
      data: {
        id,
        message: 'Flight details endpoint - coming soon'
      }
    });

  } catch (error) {
    logger.error('Flight details error:', error);
    next(error);
  }
};

/**
 * Получить популярные направления
 */
exports.getPopularDestinations = async (req, res, next) => {
  try {
    // TODO: Implement popular destinations
    // Можно брать из кэша или статичный список
    
    const popular = [
      { code: 'LON', name: 'London', country: 'UK' },
      { code: 'PAR', name: 'Paris', country: 'France' },
      { code: 'NYC', name: 'New York', country: 'USA' },
      { code: 'DXB', name: 'Dubai', country: 'UAE' },
      { code: 'TYO', name: 'Tokyo', country: 'Japan' }
    ];

    res.json({
      success: true,
      data: popular
    });

  } catch (error) {
    logger.error('Popular destinations error:', error);
    next(error);
  }
};
