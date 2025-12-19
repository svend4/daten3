// src/app.js
const cron = require('node-cron');
const { checkPriceAlerts } = require('./jobs/priceAlertChecker');

// Run price alert checker every hour
cron.schedule('0 * * * *', () => {
  logger.info('Running scheduled price alert check...');
  checkPriceAlerts();
});
