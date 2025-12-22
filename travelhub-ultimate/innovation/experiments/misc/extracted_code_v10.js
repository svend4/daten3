const axios = require('axios');
const config = require('../../config/api.config');
const logger = require('../../utils/logger');
const { CacheService, CACHE_TTL } = require('../cache.service');

class TravelpayoutsService {
  constructor() {
    this.token = config.travelpayouts.token;
    this.marker = config.travelpayouts.marker;
    this.baseUrl = config.travelpayouts.baseUrl;
    this.autocompleteUrl = config.travelpayouts.autocompleteUrl;
  }

  /**
   * Поиск авиабилетов
   */
  async searchFlights(params) {
    const cacheKey = CacheService.generateKey('flights', params);
    
    // Проверить кэш
    const cached = await CacheService.getJSON(cacheKey);
    if (cached) {
      logger.info('Returning cached flight results');
      return cached;
    }

    try {
      logger.info('Searching flights:', params);

      const response = await axios.get(
        `${this.baseUrl}/aviasales/v3/prices_for_dates`,
        {
          params: {
            ...params,
            token: this.token,
            currency: params.currency || 'usd',
            limit: params.limit || 30,
            sorting: 'price'
          },
          timeout: config.travelpayouts.timeout
        }
      );

      if (!response.data.success) {
        throw new Error('API returned unsuccessful response');
      }

      const results = this.formatFlightResults(response.data.data);
      
      // Сохранить в кэш
      await CacheService.setJSON(cacheKey, results, CACHE_TTL.FLIGHTS_SEARCH);
      
      logger.info(`Found ${results.length} flights`);
      return results;

    } catch (error) {
      logger.error('Travelpayouts flight search error:', {
        message: error.message,
        params: params
      });
      throw new Error('Failed to search flights');
    }
  }

  /**
   * Поиск города для отелей
   */
  async searchLocation(query) {
    const cacheKey = `location:${query}`;
    
    const cached = await CacheService.getJSON(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${this.autocompleteUrl}/places2`, {
        params: {
          term: query,
          locale: 'en',
          types: 'city'
        }
      });

      const results = response.data || [];
      
      await CacheService.setJSON(
        cacheKey, 
        results, 
        CACHE_TTL.LOCATION_AUTOCOMPLETE
      );
      
      return results;

    } catch (error) {
      logger.error('Location search error:', error.message);
      throw new Error('Failed to search location');
    }
  }

  /**
   * Форматирование результатов авиабилетов
   */
  formatFlightResults(data) {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(flight => ({
      id: `${flight.origin}-${flight.destination}-${flight.departure_at}`,
      route: {
        origin: flight.origin,
        destination: flight.destination,
        originAirport: flight.origin_airport,
        destinationAirport: flight.destination_airport
      },
      dates: {
        departure: flight.departure_at,
        return: flight.return_at
      },
      price: {
        amount: flight.price,
        currency: 'USD'
      },
      airline: {
        code: flight.airline,
        name: this.getAirlineName(flight.airline)
      },
      flightNumber: flight.flight_number,
      transfers: flight.transfers,
      duration: flight.duration,
      link: this.generateFlightUrl(flight)
    }));
  }

  /**
   * Генерация партнёрской ссылки для авиабилета
   */
  generateFlightUrl(flight) {
    const origin = flight.origin;
    const dest = flight.destination;
    const depart = flight.departure_at.split('T')[0].replace(/-/g, '');
    const ret = flight.return_at ? 
      flight.return_at.split('T')[0].replace(/-/g, '') : '';
    
    const search = `${origin}${depart}${dest}${ret}`;
    
    return `https://www.aviasales.com/search/${search}?marker=${this.marker}`;
  }

  /**
   * Получить название авиакомпании по коду
   */
  getAirlineName(code) {
    const airlines = {
      'BA': 'British Airways',
      'LH': 'Lufthansa',
      'AF': 'Air France',
      'SU': 'Aeroflot',
      'AA': 'American Airlines',
      'UA': 'United Airlines',
      'DL': 'Delta Air Lines',
      'EK': 'Emirates',
      'TK': 'Turkish Airlines',
      'QR': 'Qatar Airways'
      // Добавить больше по необходимости
    };
    return airlines[code] || code;
  }

  /**
   * Получить статистику API
   */
  async getStats() {
    // Можно добавить логику для отслеживания использования API
    return {
      provider: 'Travelpayouts',
      requestsToday: 0, // TODO: implement tracking
      cacheHitRate: 0   // TODO: implement tracking
    };
  }
}

module.exports = new TravelpayoutsService();
