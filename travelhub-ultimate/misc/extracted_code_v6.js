const redis = require('redis');
const logger = require('../utils/logger');

let client;

async function createRedisClient() {
  if (client) {
    return client;
  }

  client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis reconnection failed after 10 attempts');
          return new Error('Redis reconnection failed');
        }
        return retries * 100; // Exponential backoff
      }
    }
  });

  client.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  client.on('reconnecting', () => {
    logger.warn('Redis Client Reconnecting...');
  });

  await client.connect();

  return client;
}

module.exports = { createRedisClient, getClient: () => client };
