/**
 * Background Job Scheduler
 * Handles cron jobs and scheduled tasks
 *
 * TODO: Install node-cron package
 * npm install node-cron
 * npm install @types/node-cron --save-dev
 */

import logger from '../utils/logger.js';
import { commissionService } from '../services/commission.service.js';
import { notificationService } from '../services/notification.service.js';
import { checkPriceAlerts, cleanupOldPriceAlerts } from './priceAlerts.job.js';

/**
 * Scheduler Service Class
 * Manages all background jobs and cron tasks
 */
class SchedulerService {
  /**
   * Initialize all scheduled jobs
   */
  async initialize(): Promise<void> {
    logger.info('Initializing background job scheduler...');

    // TODO: Uncomment when node-cron is installed
    /*
    const cron = require('node-cron');

    // Auto-approve commissions daily at midnight
    cron.schedule('0 0 * * *', async () => {
      await this.autoApproveCommissions();
    });

    // Send booking reminders daily at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
      await this.sendBookingReminders();
    });

    // Check price alerts every hour
    cron.schedule('0 * * * *', async () => {
      await this.checkPriceAlerts();
    });

    // Clean up old data weekly on Sunday at 2:00 AM
    cron.schedule('0 2 * * 0', async () => {
      await this.cleanupOldData();
    });

    logger.info('Background jobs scheduled successfully');
    */

    logger.info('Background job scheduler initialized (cron package not installed)');
  }

  /**
   * Auto-approve commissions after holding period
   * Runs: Daily at 00:00
   */
  async autoApproveCommissions(): Promise<void> {
    try {
      logger.info('Running: Auto-approve commissions job');

      const approved = await commissionService.autoApproveCommissions();

      logger.info(`Auto-approved ${approved} commissions`);
    } catch (error: any) {
      logger.error('Auto-approve commissions job failed:', error);
    }
  }

  /**
   * Send booking reminders for tomorrow's bookings
   * Runs: Daily at 10:00
   */
  async sendBookingReminders(): Promise<void> {
    try {
      logger.info('Running: Send booking reminders job');

      await notificationService.sendBookingReminders();

      logger.info('Booking reminders sent successfully');
    } catch (error: any) {
      logger.error('Send booking reminders job failed:', error);
    }
  }

  /**
   * Check price alerts and notify users
   * Runs: Hourly
   */
  async checkPriceAlerts(): Promise<void> {
    try {
      logger.info('Running: Check price alerts job');

      const triggeredCount = await checkPriceAlerts();

      logger.info(`Price alerts checked successfully. Triggered: ${triggeredCount}`);
    } catch (error: any) {
      logger.error('Check price alerts job failed:', error);
    }
  }

  /**
   * Clean up old data (expired sessions, old logs, etc.)
   * Runs: Weekly on Sunday at 02:00
   */
  async cleanupOldData(): Promise<void> {
    try {
      logger.info('Running: Cleanup old data job');

      // Clean up old price alerts (triggered > 30 days ago)
      const deletedAlerts = await cleanupOldPriceAlerts();
      logger.info(`Deleted ${deletedAlerts} old price alerts`);

      // TODO: Additional cleanup tasks:
      // - Delete expired sessions
      // - Archive old logs
      // - Clean up old analytics data (>90 days)
      // - Remove old affiliate clicks (>180 days)

      logger.info('Old data cleaned up successfully');
    } catch (error: any) {
      logger.error('Cleanup old data job failed:', error);
    }
  }

  /**
   * Manually trigger a job (for testing)
   */
  async runJob(jobName: string): Promise<void> {
    switch (jobName) {
      case 'autoApproveCommissions':
        await this.autoApproveCommissions();
        break;
      case 'sendBookingReminders':
        await this.sendBookingReminders();
        break;
      case 'checkPriceAlerts':
        await this.checkPriceAlerts();
        break;
      case 'cleanupOldData':
        await this.cleanupOldData();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
export default schedulerService;
