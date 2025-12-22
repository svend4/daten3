// src/routes/index.js
router.get('/health', async (req, res) => {
  try {
    const { getClient } = require('../config/redis.config');
    const redisClient = getClient();
    
    // Check Redis
    const redisStatus = await redisClient.ping()
      .then(() => 'OK')
      .catch(() => 'ERROR');

    // Check API providers (optional)
    const apiStatus = {
      travelpayouts: 'OK',  // TODO: implement actual check
      booking: 'OK'
    };

    const status = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      redis: redisStatus,
      apis: apiStatus,
      version: process.env.npm_package_version
    };

    res.json(status);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      error: error.message
    });
  }
});
