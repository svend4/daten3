/**
 * Background Jobs Service
 * Scheduled background tasks with Message Queue integration
 * Based on Innovation Library best practices
 */

import { messageQueueService, QueueName, JobType, JobPriority } from './messageQueue.service.js';
import { prisma } from '../lib/prisma.js';
import { redisService } from './redis.service.js';
import logger from '../utils/logger.js';

/**
 * Job schedule configurations
 */
export enum JobSchedule {
  EVERY_MINUTE = '* * * * *',
  EVERY_5_MINUTES = '*/5 * * * *',
  EVERY_15_MINUTES = '*/15 * * * *',
  EVERY_30_MINUTES = '*/30 * * * *',
  EVERY_HOUR = '0 * * * *',
  EVERY_6_HOURS = '0 */6 * * *',
  EVERY_12_HOURS = '0 */12 * * *',
  DAILY = '0 0 * * *',           // Midnight
  WEEKLY = '0 0 * * 0',          // Sunday midnight
  MONTHLY = '0 0 1 * *',         // 1st of month
}

/**
 * Background job definition
 */
interface BackgroundJob {
  name: string;
  description: string;
  schedule: string;              // Cron expression
  queueName: QueueName;
  jobType: JobType;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  failCount: number;
}

/**
 * Background Jobs statistics
 */
const stats = {
  totalRuns: 0,
  totalSuccess: 0,
  totalFailures: 0,
  byJob: new Map<string, {
    runs: number;
    success: number;
    failures: number;
    lastRun?: Date;
    avgDuration: number;
  }>(),
  recentRuns: [] as Array<{
    job: string;
    status: 'success' | 'failure';
    duration: number;
    timestamp: Date;
    error?: string;
  }>,
};

/**
 * Background Jobs Service
 */
class BackgroundJobsService {
  private jobs: Map<string, BackgroundJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private initialized = false;

  /**
   * Initialize background jobs service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Background Jobs Service already initialized');
      return;
    }

    try {
      // Register default jobs
      this.registerDefaultJobs();

      // Start all enabled jobs
      this.startAllJobs();

      this.initialized = true;
      logger.info('Background Jobs Service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize Background Jobs Service:', error);
      throw error;
    }
  }

  /**
   * Register default background jobs
   */
  private registerDefaultJobs(): void {
    // Cleanup old audit logs (daily)
    this.registerJob({
      name: 'cleanup_old_audit_logs',
      description: 'Clean up audit logs older than 90 days',
      schedule: JobSchedule.DAILY,
      queueName: QueueName.CLEANUP,
      jobType: JobType.CLEANUP_OLD_LOGS,
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    // Cleanup expired sessions (every hour)
    this.registerJob({
      name: 'cleanup_expired_sessions',
      description: 'Clean up expired user sessions',
      schedule: JobSchedule.EVERY_HOUR,
      queueName: QueueName.CLEANUP,
      jobType: JobType.CLEANUP_EXPIRED_SESSIONS,
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    // Cleanup old cache entries (every 6 hours)
    this.registerJob({
      name: 'cleanup_old_cache',
      description: 'Clean up old cache entries',
      schedule: JobSchedule.EVERY_6_HOURS,
      queueName: QueueName.CLEANUP,
      jobType: JobType.CLEANUP_OLD_CACHE,
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    // Generate daily booking report (daily)
    this.registerJob({
      name: 'generate_daily_booking_report',
      description: 'Generate daily booking report for admins',
      schedule: JobSchedule.DAILY,
      queueName: QueueName.REPORT,
      jobType: JobType.GENERATE_BOOKING_REPORT,
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    // Generate weekly commission report (weekly)
    this.registerJob({
      name: 'generate_weekly_commission_report',
      description: 'Generate weekly commission report for affiliates',
      schedule: JobSchedule.WEEKLY,
      queueName: QueueName.REPORT,
      jobType: JobType.GENERATE_COMMISSION_REPORT,
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    // Process pending payouts (daily)
    this.registerJob({
      name: 'process_pending_payouts',
      description: 'Process pending affiliate payouts',
      schedule: JobSchedule.DAILY,
      queueName: QueueName.PAYMENT,
      jobType: JobType.PROCESS_PAYOUT,
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    logger.info('Default background jobs registered');
  }

  /**
   * Register a background job
   */
  registerJob(job: BackgroundJob): void {
    this.jobs.set(job.name, job);

    // Initialize stats
    stats.byJob.set(job.name, {
      runs: 0,
      success: 0,
      failures: 0,
      avgDuration: 0,
    });

    logger.info(`Background job "${job.name}" registered`);
  }

  /**
   * Start a specific job
   */
  startJob(jobName: string): void {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job "${jobName}" not found`);
    }

    if (!job.enabled) {
      logger.warn(`Job "${jobName}" is disabled`);
      return;
    }

    // Stop existing interval if any
    this.stopJob(jobName);

    // Calculate interval from cron expression
    const interval = this.cronToInterval(job.schedule);

    // Schedule job
    const intervalId = setInterval(async () => {
      await this.executeJob(jobName);
    }, interval);

    this.intervals.set(jobName, intervalId);

    // Execute immediately on start
    this.executeJob(jobName);

    logger.info(`Background job "${jobName}" started (interval: ${interval}ms)`);
  }

  /**
   * Stop a specific job
   */
  stopJob(jobName: string): void {
    const intervalId = this.intervals.get(jobName);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(jobName);
      logger.info(`Background job "${jobName}" stopped`);
    }
  }

  /**
   * Start all enabled jobs
   */
  startAllJobs(): void {
    for (const [name, job] of this.jobs.entries()) {
      if (job.enabled) {
        this.startJob(name);
      }
    }
  }

  /**
   * Stop all jobs
   */
  stopAllJobs(): void {
    for (const name of this.intervals.keys()) {
      this.stopJob(name);
    }
  }

  /**
   * Execute a background job
   */
  private async executeJob(jobName: string): Promise<void> {
    const job = this.jobs.get(jobName);
    if (!job) {
      logger.error(`Job "${jobName}" not found`);
      return;
    }

    const startTime = Date.now();

    try {
      logger.info(`Executing background job: ${jobName}`);

      // Get job data based on job type
      const jobData = await this.getJobData(job.jobType);

      // Add job to queue
      await messageQueueService.addJob(
        job.queueName,
        job.jobType,
        jobData,
        {
          priority: JobPriority.NORMAL,
          attempts: 3,
        }
      );

      const duration = Date.now() - startTime;

      // Update job metadata
      job.lastRun = new Date();
      job.runCount++;

      // Update stats
      stats.totalRuns++;
      stats.totalSuccess++;
      this.updateJobStats(jobName, 'success', duration);

      logger.info(`Background job "${jobName}" executed successfully (${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Update job metadata
      job.failCount++;

      // Update stats
      stats.totalRuns++;
      stats.totalFailures++;
      this.updateJobStats(jobName, 'failure', duration, error.message);

      logger.error(`Background job "${jobName}" failed:`, error);
    }
  }

  /**
   * Get job data based on job type
   */
  private async getJobData(jobType: JobType): Promise<any> {
    switch (jobType) {
      case JobType.CLEANUP_OLD_LOGS:
        return {
          cutoffDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        };

      case JobType.CLEANUP_EXPIRED_SESSIONS:
        return {
          cutoffDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        };

      case JobType.CLEANUP_OLD_CACHE:
        return {
          pattern: 'cache:*',
        };

      case JobType.GENERATE_BOOKING_REPORT:
        return {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          endDate: new Date(),
          type: 'daily',
        };

      case JobType.GENERATE_COMMISSION_REPORT:
        return {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
          endDate: new Date(),
          type: 'weekly',
        };

      case JobType.PROCESS_PAYOUT:
        return {
          status: 'pending',
          minAmount: 50, // Minimum payout amount
        };

      default:
        return {};
    }
  }

  /**
   * Update job statistics
   */
  private updateJobStats(
    jobName: string,
    status: 'success' | 'failure',
    duration: number,
    error?: string
  ): void {
    let jobStats = stats.byJob.get(jobName);

    if (!jobStats) {
      jobStats = {
        runs: 0,
        success: 0,
        failures: 0,
        avgDuration: 0,
      };
      stats.byJob.set(jobName, jobStats);
    }

    jobStats.runs++;
    jobStats.lastRun = new Date();

    if (status === 'success') {
      jobStats.success++;
    } else {
      jobStats.failures++;
    }

    // Update average duration
    jobStats.avgDuration = Math.round(
      (jobStats.avgDuration * (jobStats.runs - 1) + duration) / jobStats.runs
    );

    // Add to recent runs
    stats.recentRuns.push({
      job: jobName,
      status,
      duration,
      timestamp: new Date(),
      error,
    });

    // Keep only last 50 recent runs
    if (stats.recentRuns.length > 50) {
      stats.recentRuns = stats.recentRuns.slice(-50);
    }
  }

  /**
   * Convert cron expression to interval (simplified)
   */
  private cronToInterval(cron: string): number {
    // Simplified conversion - in production use a proper cron parser
    switch (cron) {
      case JobSchedule.EVERY_MINUTE:
        return 60 * 1000; // 1 minute
      case JobSchedule.EVERY_5_MINUTES:
        return 5 * 60 * 1000; // 5 minutes
      case JobSchedule.EVERY_15_MINUTES:
        return 15 * 60 * 1000; // 15 minutes
      case JobSchedule.EVERY_30_MINUTES:
        return 30 * 60 * 1000; // 30 minutes
      case JobSchedule.EVERY_HOUR:
        return 60 * 60 * 1000; // 1 hour
      case JobSchedule.EVERY_6_HOURS:
        return 6 * 60 * 60 * 1000; // 6 hours
      case JobSchedule.EVERY_12_HOURS:
        return 12 * 60 * 60 * 1000; // 12 hours
      case JobSchedule.DAILY:
        return 24 * 60 * 60 * 1000; // 24 hours
      case JobSchedule.WEEKLY:
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case JobSchedule.MONTHLY:
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return 60 * 60 * 1000; // Default: 1 hour
    }
  }

  /**
   * Get all jobs
   */
  getAllJobs(): BackgroundJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get job by name
   */
  getJob(jobName: string): BackgroundJob | undefined {
    return this.jobs.get(jobName);
  }

  /**
   * Enable job
   */
  enableJob(jobName: string): void {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job "${jobName}" not found`);
    }

    job.enabled = true;
    this.startJob(jobName);
    logger.info(`Job "${jobName}" enabled`);
  }

  /**
   * Disable job
   */
  disableJob(jobName: string): void {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job "${jobName}" not found`);
    }

    job.enabled = false;
    this.stopJob(jobName);
    logger.info(`Job "${jobName}" disabled`);
  }

  /**
   * Get service statistics
   */
  getStats() {
    const byJob: Record<string, any> = {};
    for (const [name, jobStats] of stats.byJob.entries()) {
      byJob[name] = { ...jobStats };
    }

    return {
      totalRuns: stats.totalRuns,
      totalSuccess: stats.totalSuccess,
      totalFailures: stats.totalFailures,
      byJob,
      recentRuns: stats.recentRuns.slice(-20), // Last 20 runs
      registeredJobs: this.getAllJobs().map(job => ({
        name: job.name,
        description: job.description,
        schedule: job.schedule,
        enabled: job.enabled,
        lastRun: job.lastRun,
        runCount: job.runCount,
        failCount: job.failCount,
      })),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    stats.totalRuns = 0;
    stats.totalSuccess = 0;
    stats.totalFailures = 0;
    stats.byJob.clear();
    stats.recentRuns = [];

    // Reinitialize job stats
    for (const jobName of this.jobs.keys()) {
      stats.byJob.set(jobName, {
        runs: 0,
        success: 0,
        failures: 0,
        avgDuration: 0,
      });
    }
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Background Jobs Service...');
    this.stopAllJobs();
    this.initialized = false;
    logger.info('Background Jobs Service shut down');
  }
}

// Export singleton instance
export const backgroundJobsService = new BackgroundJobsService();

/**
 * Get background jobs statistics (standalone export for health controller)
 */
export const getBackgroundJobsStats = () => {
  return backgroundJobsService.getStats();
};

/**
 * Reset background jobs statistics
 */
export const resetBackgroundJobsStats = (): void => {
  backgroundJobsService.resetStats();
};

export default backgroundJobsService;
