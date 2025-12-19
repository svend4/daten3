const cron = require('node-cron');
const commissionService = require('../services/commission.service');
const logger = require('../utils/logger');

/**
 * Запускать каждый день в 2:00 AM
 */
function startCommissionApprovalJob() {
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Running commission auto-approval job...');
      
      const approved = await commissionService.autoApproveCommissions();
      
      logger.info(`Commission auto-approval completed. Approved: ${approved}`);
    } catch (error) {
      logger.error('Commission auto-approval job failed:', error);
    }
  });

  logger.info('Commission auto-approval job scheduled (daily at 2:00 AM)');
}

module.exports = { startCommissionApprovalJob };
