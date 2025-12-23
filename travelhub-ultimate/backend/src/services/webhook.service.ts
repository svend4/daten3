/**
 * Webhook Service
 * Send webhooks to external services with retry logic
 * Based on Innovation Library best practices
 */

import { createHmac } from 'crypto';
import logger from '../utils/logger.js';

/**
 * Webhook event types
 */
export enum WebhookEventType {
  BOOKING_CREATED = 'booking.created',
  BOOKING_UPDATED = 'booking.updated',
  BOOKING_CONFIRMED = 'booking.confirmed',
  BOOKING_CANCELLED = 'booking.cancelled',

  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',

  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',

  COMMISSION_EARNED = 'commission.earned',
  PAYOUT_PROCESSED = 'payout.processed',
}

/**
 * Webhook payload
 */
interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Webhook configuration
 */
interface WebhookConfig {
  url: string;
  secret: string;
  events: WebhookEventType[];
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Webhook attempt
 */
interface WebhookAttempt {
  url: string;
  event: WebhookEventType;
  attempt: number;
  success: boolean;
  statusCode?: number;
  error?: string;
  duration: number;
  timestamp: Date;
}

/**
 * Webhook statistics
 */
interface WebhookStats {
  total: number;
  successful: number;
  failed: number;
  retries: number;
  byEvent: Map<WebhookEventType, { total: number; successful: number; failed: number }>;
  byUrl: Map<string, { total: number; successful: number; failed: number }>;
  recentAttempts: WebhookAttempt[];
}

const stats: WebhookStats = {
  total: 0,
  successful: 0,
  failed: 0,
  retries: 0,
  byEvent: new Map(),
  byUrl: new Map(),
  recentAttempts: [],
};

/**
 * Max recent attempts to keep
 */
const MAX_RECENT_ATTEMPTS = 100;

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  timeout: 5000,    // 5 seconds
};

/**
 * Webhook endpoints registry
 */
const webhookEndpoints = new Map<string, WebhookConfig>();

/**
 * Register webhook endpoint
 */
export const registerWebhook = (
  name: string,
  config: WebhookConfig
): void => {
  webhookEndpoints.set(name, {
    ...DEFAULT_CONFIG,
    ...config,
  });

  logger.info(`Webhook endpoint registered: ${name} -> ${config.url}`);
};

/**
 * Unregister webhook endpoint
 */
export const unregisterWebhook = (name: string): boolean => {
  const deleted = webhookEndpoints.delete(name);

  if (deleted) {
    logger.info(`Webhook endpoint unregistered: ${name}`);
  }

  return deleted;
};

/**
 * Generate webhook signature
 */
const generateSignature = (payload: string, secret: string): string => {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
};

/**
 * Update statistics
 */
const updateStats = (
  url: string,
  event: WebhookEventType,
  success: boolean,
  isRetry: boolean
): void => {
  stats.total++;

  if (success) {
    stats.successful++;
  } else {
    stats.failed++;
  }

  if (isRetry) {
    stats.retries++;
  }

  // Event stats
  const eventStats = stats.byEvent.get(event) || { total: 0, successful: 0, failed: 0 };
  eventStats.total++;
  if (success) eventStats.successful++;
  else eventStats.failed++;
  stats.byEvent.set(event, eventStats);

  // URL stats
  const urlStats = stats.byUrl.get(url) || { total: 0, successful: 0, failed: 0 };
  urlStats.total++;
  if (success) urlStats.successful++;
  else urlStats.failed++;
  stats.byUrl.set(url, urlStats);
};

/**
 * Add attempt to recent attempts
 */
const addRecentAttempt = (attempt: WebhookAttempt): void => {
  stats.recentAttempts.push(attempt);

  // Keep only recent attempts
  if (stats.recentAttempts.length > MAX_RECENT_ATTEMPTS) {
    stats.recentAttempts.shift();
  }
};

/**
 * Send webhook with retry logic
 */
const sendWebhookWithRetry = async (
  config: WebhookConfig,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<boolean> => {
  const startTime = Date.now();

  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, config.secret);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || DEFAULT_CONFIG.timeout);

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        'User-Agent': 'TravelHub-Webhook/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;
    const success = response.ok;

    // Add to recent attempts
    addRecentAttempt({
      url: config.url,
      event: payload.event,
      attempt,
      success,
      statusCode: response.status,
      duration,
      timestamp: new Date(),
    });

    if (!success) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    updateStats(config.url, payload.event, true, attempt > 1);

    logger.info(`Webhook sent successfully to ${config.url} (attempt ${attempt})`);

    return true;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Add to recent attempts
    addRecentAttempt({
      url: config.url,
      event: payload.event,
      attempt,
      success: false,
      error: error.message,
      duration,
      timestamp: new Date(),
    });

    logger.error(`Webhook failed to ${config.url} (attempt ${attempt}):`, error.message);

    // Retry logic
    const maxAttempts = config.retryAttempts || DEFAULT_CONFIG.retryAttempts;
    if (attempt < maxAttempts) {
      const delay = (config.retryDelay || DEFAULT_CONFIG.retryDelay) * Math.pow(2, attempt - 1); // Exponential backoff

      logger.info(`Retrying webhook in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));

      return sendWebhookWithRetry(config, payload, attempt + 1);
    }

    updateStats(config.url, payload.event, false, attempt > 1);

    return false;
  }
};

/**
 * Send webhook to all registered endpoints
 */
export const sendWebhook = async (
  event: WebhookEventType,
  data: any,
  metadata?: Record<string, any>
): Promise<void> => {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    metadata,
  };

  // Find endpoints that subscribed to this event
  const endpoints = Array.from(webhookEndpoints.entries()).filter(([_, config]) =>
    config.events.includes(event)
  );

  if (endpoints.length === 0) {
    logger.debug(`No webhook endpoints subscribed to event: ${event}`);
    return;
  }

  logger.info(`Sending webhook ${event} to ${endpoints.length} endpoint(s)`);

  // Send webhooks in parallel
  await Promise.all(
    endpoints.map(([name, config]) =>
      sendWebhookWithRetry(config, payload).catch(error => {
        logger.error(`Webhook to ${name} failed:`, error);
      })
    )
  );
};

/**
 * Helper functions for common events
 */

/**
 * Send booking created webhook
 */
export const sendBookingCreated = async (booking: any): Promise<void> => {
  await sendWebhook(WebhookEventType.BOOKING_CREATED, booking);
};

/**
 * Send payment succeeded webhook
 */
export const sendPaymentSucceeded = async (payment: any): Promise<void> => {
  await sendWebhook(WebhookEventType.PAYMENT_SUCCEEDED, payment);
};

/**
 * Send commission earned webhook
 */
export const sendCommissionEarned = async (commission: any): Promise<void> => {
  await sendWebhook(WebhookEventType.COMMISSION_EARNED, commission);
};

/**
 * Get webhook statistics
 */
export const getWebhookStats = () => {
  const byEvent: Record<string, { total: number; successful: number; failed: number; successRate: number }> = {};
  for (const [event, eventStats] of stats.byEvent.entries()) {
    byEvent[event] = {
      ...eventStats,
      successRate: eventStats.total > 0
        ? Math.round((eventStats.successful / eventStats.total) * 100)
        : 0,
    };
  }

  const byUrl: Record<string, { total: number; successful: number; failed: number }> = {};
  for (const [url, urlStats] of stats.byUrl.entries()) {
    byUrl[url] = urlStats;
  }

  return {
    total: stats.total,
    successful: stats.successful,
    failed: stats.failed,
    retries: stats.retries,
    successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0,
    byEvent,
    byUrl,
    recentAttempts: stats.recentAttempts.slice(-20).map(attempt => ({
      url: attempt.url,
      event: attempt.event,
      attempt: attempt.attempt,
      success: attempt.success,
      statusCode: attempt.statusCode,
      duration: attempt.duration,
      timestamp: attempt.timestamp.toISOString(),
    })),
  };
};

/**
 * Reset webhook statistics
 */
export const resetWebhookStats = (): void => {
  stats.total = 0;
  stats.successful = 0;
  stats.failed = 0;
  stats.retries = 0;
  stats.byEvent.clear();
  stats.byUrl.clear();
  stats.recentAttempts = [];
};

/**
 * Get all registered webhooks
 */
export const getAllWebhooks = (): Array<{ name: string; config: Omit<WebhookConfig, 'secret'> }> => {
  return Array.from(webhookEndpoints.entries()).map(([name, config]) => ({
    name,
    config: {
      url: config.url,
      events: config.events,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      timeout: config.timeout,
      secret: '***REDACTED***' as any,
    },
  }));
};

export default {
  registerWebhook,
  unregisterWebhook,
  sendWebhook,
  sendBookingCreated,
  sendPaymentSucceeded,
  sendCommissionEarned,
  WebhookEventType,
};
