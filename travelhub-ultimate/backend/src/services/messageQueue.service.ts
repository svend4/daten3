/**
 * Message Queue Service
 * Async task processing with BullMQ
 * Based on Innovation Library best practices
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { redisService } from './redis.service.js';
import logger from '../utils/logger.js';

/**
 * Queue names
 */
export enum QueueName {
  EMAIL = 'email',
  REPORT = 'report',
  PAYMENT = 'payment',
  CLEANUP = 'cleanup',
  NOTIFICATION = 'notification',
  WEBHOOK = 'webhook',
  EXPORT = 'export',
}

/**
 * Job types
 */
export enum JobType {
  // Email jobs
  SEND_EMAIL = 'send_email',
  SEND_WELCOME_EMAIL = 'send_welcome_email',
  SEND_BOOKING_CONFIRMATION = 'send_booking_confirmation',
  SEND_PAYMENT_RECEIPT = 'send_payment_receipt',
  SEND_PASSWORD_RESET = 'send_password_reset',

  // Report jobs
  GENERATE_BOOKING_REPORT = 'generate_booking_report',
  GENERATE_COMMISSION_REPORT = 'generate_commission_report',
  GENERATE_ANALYTICS_REPORT = 'generate_analytics_report',

  // Payment jobs
  PROCESS_PAYOUT = 'process_payout',
  PROCESS_REFUND = 'process_refund',
  PROCESS_COMMISSION = 'process_commission',

  // Cleanup jobs
  CLEANUP_OLD_LOGS = 'cleanup_old_logs',
  CLEANUP_EXPIRED_SESSIONS = 'cleanup_expired_sessions',
  CLEANUP_OLD_CACHE = 'cleanup_old_cache',

  // Notification jobs
  SEND_PUSH_NOTIFICATION = 'send_push_notification',
  SEND_SMS_NOTIFICATION = 'send_sms_notification',

  // Webhook jobs
  SEND_WEBHOOK = 'send_webhook',

  // Export jobs
  EXPORT_DATA = 'export_data',
}

/**
 * Job priority levels
 */
export enum JobPriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 1,
  CRITICAL = 0,
}

/**
 * Job options
 */
interface JobOptions {
  priority?: JobPriority;
  delay?: number;           // Delay in milliseconds
  attempts?: number;        // Number of retry attempts
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number; // Keep N completed jobs
  removeOnFail?: boolean | number;     // Keep N failed jobs
}

/**
 * Queue statistics
 */
interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

/**
 * Message Queue Service statistics
 */
const stats = {
  totalJobsAdded: 0,
  totalJobsCompleted: 0,
  totalJobsFailed: 0,
  byQueue: new Map<string, {
    added: number;
    completed: number;
    failed: number;
  }>(),
  byJobType: new Map<string, {
    added: number;
    completed: number;
    failed: number;
    avgDuration: number;
  }>(),
  recentJobs: [] as Array<{
    id: string;
    queue: string;
    type: string;
    status: 'completed' | 'failed';
    duration: number;
    timestamp: Date;
  }>,
};

/**
 * Message Queue Service
 */
class MessageQueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private handlers: Map<string, (job: Job) => Promise<any>> = new Map();
  private initialized = false;

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Initialize message queue service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Message Queue Service already initialized');
      return;
    }

    try {
      // Get Redis connection from redisService
      const redisClient = redisService.getClient();

      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      // Create connection config for BullMQ
      const connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      };

      // Create queues
      for (const queueName of Object.values(QueueName)) {
        const queue = new Queue(queueName, { connection });
        this.queues.set(queueName, queue);

        // Initialize stats for queue
        stats.byQueue.set(queueName, {
          added: 0,
          completed: 0,
          failed: 0,
        });

        // Setup queue events
        const queueEvents = new QueueEvents(queueName, { connection });
        this.queueEvents.set(queueName, queueEvents);

        // Listen to events
        queueEvents.on('completed', ({ jobId }) => {
          this.handleJobCompleted(queueName, jobId);
        });

        queueEvents.on('failed', ({ jobId, failedReason }) => {
          this.handleJobFailed(queueName, jobId, failedReason);
        });

        logger.info(`Queue "${queueName}" created`);
      }

      this.initialized = true;
      logger.info('Message Queue Service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize Message Queue Service:', error);
      throw error;
    }
  }

  /**
   * Register job handler
   */
  registerHandler(
    queueName: QueueName,
    jobType: JobType,
    handler: (data: any) => Promise<any>
  ): void {
    const key = `${queueName}:${jobType}`;
    this.handlers.set(key, async (job: Job) => {
      logger.info(`Processing job ${job.id} (${jobType}) in queue ${queueName}`);
      return handler(job.data);
    });

    // Create or update worker for this queue
    if (!this.workers.has(queueName)) {
      const connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      };

      const worker = new Worker(
        queueName,
        async (job: Job) => {
          const handlerKey = `${queueName}:${job.name}`;
          const handler = this.handlers.get(handlerKey);

          if (!handler) {
            throw new Error(`No handler registered for job type: ${job.name}`);
          }

          const startTime = Date.now();
          try {
            const result = await handler(job);
            const duration = Date.now() - startTime;

            // Update stats
            this.updateJobTypeStats(job.name, 'completed', duration);

            return result;
          } catch (error) {
            const duration = Date.now() - startTime;
            this.updateJobTypeStats(job.name, 'failed', duration);
            throw error;
          }
        },
        {
          connection,
          concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
        }
      );

      this.workers.set(queueName, worker);
      logger.info(`Worker created for queue "${queueName}"`);
    }
  }

  /**
   * Add job to queue
   */
  async addJob<T = any>(
    queueName: QueueName,
    jobType: JobType,
    data: T,
    options?: JobOptions
  ): Promise<Job> {
    if (!this.initialized) {
      throw new Error('Message Queue Service not initialized');
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    const defaultOptions: JobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 100,     // Keep last 100 failed jobs
      priority: JobPriority.NORMAL,
    };

    const jobOptions = { ...defaultOptions, ...options };

    try {
      const job = await queue.add(jobType, data, jobOptions);

      // Update stats
      stats.totalJobsAdded++;
      const queueStats = stats.byQueue.get(queueName);
      if (queueStats) {
        queueStats.added++;
      }

      logger.info(`Job ${job.id} added to queue "${queueName}" (type: ${jobType})`);
      return job;
    } catch (error: any) {
      logger.error(`Failed to add job to queue "${queueName}":`, error);
      throw error;
    }
  }

  /**
   * Add multiple jobs to queue (bulk)
   */
  async addBulkJobs<T = any>(
    queueName: QueueName,
    jobs: Array<{
      type: JobType;
      data: T;
      options?: JobOptions;
    }>
  ): Promise<Job[]> {
    if (!this.initialized) {
      throw new Error('Message Queue Service not initialized');
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    const defaultOptions: JobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 100,
      priority: JobPriority.NORMAL,
    };

    try {
      const bulkJobs = jobs.map(job => ({
        name: job.type,
        data: job.data,
        opts: { ...defaultOptions, ...job.options },
      }));

      const addedJobs = await queue.addBulk(bulkJobs);

      // Update stats
      stats.totalJobsAdded += addedJobs.length;
      const queueStats = stats.byQueue.get(queueName);
      if (queueStats) {
        queueStats.added += addedJobs.length;
      }

      logger.info(`${addedJobs.length} jobs added to queue "${queueName}"`);
      return addedJobs;
    } catch (error: any) {
      logger.error(`Failed to add bulk jobs to queue "${queueName}":`, error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: QueueName): Promise<QueueStats> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    const counts = await queue.getJobCounts();

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  }

  /**
   * Get all queues statistics
   */
  async getAllQueuesStats(): Promise<Record<string, QueueStats>> {
    const allStats: Record<string, QueueStats> = {};

    for (const [name, queue] of this.queues.entries()) {
      const counts = await queue.getJobCounts();
      allStats[name] = {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
      };
    }

    return allStats;
  }

  /**
   * Get service statistics
   */
  getStats() {
    if (!this.initialized) {
      return {
        initialized: false,
        totalJobsAdded: 0,
        totalJobsCompleted: 0,
        totalJobsFailed: 0,
        byQueue: {},
        byJobType: {},
        recentJobs: [],
      };
    }

    const byQueue: Record<string, any> = {};
    for (const [name, queueStats] of stats.byQueue.entries()) {
      byQueue[name] = { ...queueStats };
    }

    const byJobType: Record<string, any> = {};
    for (const [type, jobStats] of stats.byJobType.entries()) {
      byJobType[type] = { ...jobStats };
    }

    return {
      initialized: true,
      totalJobsAdded: stats.totalJobsAdded,
      totalJobsCompleted: stats.totalJobsCompleted,
      totalJobsFailed: stats.totalJobsFailed,
      byQueue,
      byJobType,
      recentJobs: stats.recentJobs.slice(-20), // Last 20 jobs
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    stats.totalJobsAdded = 0;
    stats.totalJobsCompleted = 0;
    stats.totalJobsFailed = 0;
    stats.byQueue.clear();
    stats.byJobType.clear();
    stats.recentJobs = [];

    // Reinitialize queue stats
    for (const queueName of Object.values(QueueName)) {
      stats.byQueue.set(queueName, {
        added: 0,
        completed: 0,
        failed: 0,
      });
    }
  }

  /**
   * Handle job completed event
   */
  private handleJobCompleted(queueName: string, jobId: string): void {
    stats.totalJobsCompleted++;
    const queueStats = stats.byQueue.get(queueName);
    if (queueStats) {
      queueStats.completed++;
    }

    logger.debug(`Job ${jobId} completed in queue "${queueName}"`);
  }

  /**
   * Handle job failed event
   */
  private handleJobFailed(queueName: string, jobId: string, reason: string): void {
    stats.totalJobsFailed++;
    const queueStats = stats.byQueue.get(queueName);
    if (queueStats) {
      queueStats.failed++;
    }

    logger.error(`Job ${jobId} failed in queue "${queueName}": ${reason}`);
  }

  /**
   * Update job type statistics
   */
  private updateJobTypeStats(jobType: string, status: 'completed' | 'failed', duration: number): void {
    let jobStats = stats.byJobType.get(jobType);

    if (!jobStats) {
      jobStats = {
        added: 0,
        completed: 0,
        failed: 0,
        avgDuration: 0,
      };
      stats.byJobType.set(jobType, jobStats);
    }

    if (status === 'completed') {
      jobStats.completed++;
      // Update average duration
      jobStats.avgDuration = Math.round(
        (jobStats.avgDuration * (jobStats.completed - 1) + duration) / jobStats.completed
      );
    } else {
      jobStats.failed++;
    }

    // Add to recent jobs
    stats.recentJobs.push({
      id: `${Date.now()}`,
      queue: jobType.split(':')[0] || 'unknown',
      type: jobType,
      status,
      duration,
      timestamp: new Date(),
    });

    // Keep only last 100 recent jobs
    if (stats.recentJobs.length > 100) {
      stats.recentJobs = stats.recentJobs.slice(-100);
    }
  }

  /**
   * Clean queue (remove all jobs)
   */
  async cleanQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    await queue.drain();
    logger.info(`Queue "${queueName}" cleaned`);
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    await queue.pause();
    logger.info(`Queue "${queueName}" paused`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    await queue.resume();
    logger.info(`Queue "${queueName}" resumed`);
  }

  /**
   * Close all queues and workers
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      logger.debug('Message Queue Service not initialized, nothing to close');
      return;
    }

    logger.info('Closing Message Queue Service...');

    // Close workers
    for (const [name, worker] of this.workers.entries()) {
      await worker.close();
      logger.info(`Worker "${name}" closed`);
    }

    // Close queue events
    for (const [name, queueEvents] of this.queueEvents.entries()) {
      await queueEvents.close();
      logger.info(`Queue events "${name}" closed`);
    }

    // Close queues
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      logger.info(`Queue "${name}" closed`);
    }

    this.queues.clear();
    this.workers.clear();
    this.queueEvents.clear();
    this.handlers.clear();
    this.initialized = false;

    logger.info('Message Queue Service closed');
  }
}

// Export singleton instance
export const messageQueueService = new MessageQueueService();

/**
 * Get message queue statistics (standalone export for health controller)
 */
export const getMessageQueueStats = () => {
  return messageQueueService.getStats();
};

/**
 * Reset message queue statistics
 */
export const resetMessageQueueStats = (): void => {
  messageQueueService.resetStats();
};

export default messageQueueService;
