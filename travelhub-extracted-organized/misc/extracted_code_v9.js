const { getClient } = require('../config/redis.config');
const logger = require('../utils/logger');

class CacheService {
  /**
   * Получить значение из кэша
   */
  async get(key) {
    try {
      const client = getClient();
      if (!client) {
        logger.warn('Redis client not available');
        return null;
      }

      const value = await client.get(key);
      
      if (value) {
        logger.debug(`Cache HIT: ${key}`);
        return value;
      }
      
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Сохранить значение в кэш
   */
  async set(key, value, ttl = 3600) {
    try {
      const client = getClient();
      if (!client) {
        logger.warn('Redis client not available');
        return false;
      }

      await client.setEx(key, ttl, value);
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Удалить значение из кэша
   */
  async del(key) {
    try {
      const client = getClient();
      if (!client) return false;

      await client.del(key);
      logger.debug(`Cache DEL: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Проверить существование ключа
   */
  async exists(key) {
    try {
      const client = getClient();
      if (!client) return false;

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Сохранить объект как JSON
   */
  async setJSON(key, obj, ttl = 3600) {
    try {
      const json = JSON.stringify(obj);
      return await this.set(key, json, ttl);
    } catch (error) {
      logger.error('Cache setJSON error:', error);
      return false;
    }
  }

  /**
   * Получить объект из JSON
   */
  async getJSON(key) {
    try {
      const json = await this.get(key);
      if (!json) return null;
      
      return JSON.parse(json);
    } catch (error) {
      logger.error('Cache getJSON error:', error);
      return null;
    }
  }

  /**
   * Генерация ключа кэша
   */
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Очистить все ключи по паттерну
   */
  async clearPattern(pattern) {
    try {
      const client = getClient();
      if (!client) return false;

      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
        logger.info(`Cleared ${keys.length} cache keys matching: ${pattern}`);
      }
      return true;
    } catch (error) {
      logger.error('Cache clearPattern error:', error);
      return false;
    }
  }
}

// TTL константы
const CACHE_TTL = {
  FLIGHTS_SEARCH: 60 * 60,          // 1 час
  HOTELS_SEARCH: 60 * 60 * 2,       // 2 часа
  HOTEL_DETAILS: 60 * 60 * 24,      // 24 часа
  LOCATION_AUTOCOMPLETE: 60 * 60 * 24 * 7,  // 7 дней
  STATIC_DATA: 60 * 60 * 24 * 30,   // 30 дней
  SHORT: 60 * 5,                    // 5 минут
  MEDIUM: 60 * 30,                  // 30 минут
  LONG: 60 * 60 * 24               // 1 день
};

module.exports = { CacheService: new CacheService(), CACHE_TTL };
