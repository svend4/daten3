/**
 * Enhanced Centralized Logging Service
 * Provides structured logging with rotation, correlation IDs, and multiple transports
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || (env === 'development' ? 'debug' : 'info');
  return logLevel;
};

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Console format (colorized, human-readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, correlationId, ...metadata }) => {
    let msg = `${timestamp}`;
    if (correlationId) {
      msg += ` [${correlationId}]`;
    }
    msg += ` [${level}]: ${message}`;

    // Filter out service metadata
    const filteredMetadata = Object.keys(metadata)
      .filter(key => key !== 'service' && key !== 'timestamp')
      .reduce((obj, key) => {
        obj[key] = metadata[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredMetadata).length > 0) {
      msg += ` ${JSON.stringify(filteredMetadata)}`;
    }
    return msg;
  })
);

// JSON format for file logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

// Define transports
const transports: winston.transport[] = [
  // Console transport (colorized)
  new winston.transports.Console({
    format: consoleFormat,
    level: level(),
  }),

  // Error log file with daily rotation
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: jsonFormat,
    maxSize: '20m',
    maxFiles: '14d', // Keep 14 days
    zippedArchive: true,
  }),

  // Combined log file with daily rotation
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: jsonFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  }),

  // HTTP log file with daily rotation
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: jsonFormat,
    maxSize: '20m',
    maxFiles: '7d', // Keep 7 days for HTTP logs
    zippedArchive: true,
  }),

  // Audit log file with daily rotation
  new DailyRotateFile({
    filename: path.join(logsDir, 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: jsonFormat,
    maxSize: '20m',
    maxFiles: '30d', // Keep 30 days for audit logs
    zippedArchive: true,
    level: 'info',
  }),
];

// Add Elasticsearch transport if configured
if (process.env.ELASTICSEARCH_URL) {
  // Note: Elasticsearch transport requires additional setup
  // This is a placeholder for production configuration
  /*
  const ElasticsearchTransport = require('winston-elasticsearch');
  transports.push(
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL,
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD,
        },
      },
      index: 'travelhub-logs',
    })
  );
  */
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  defaultMeta: {
    service: 'travelhub-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  exitOnError: false,
});

/**
 * Enhanced logger with context support
 */
class EnhancedLogger {
  private logger: winston.Logger;

  constructor(winstonLogger: winston.Logger) {
    this.logger = winstonLogger;
  }

  /**
   * Create child logger with additional context
   */
  child(metadata: Record<string, any>): EnhancedLogger {
    const childLogger = this.logger.child(metadata);
    return new EnhancedLogger(childLogger);
  }

  /**
   * Log with correlation ID
   */
  withCorrelation(correlationId: string): EnhancedLogger {
    return this.child({ correlationId });
  }

  /**
   * Log with user context
   */
  withUser(userId: string, metadata?: Record<string, any>): EnhancedLogger {
    return this.child({ userId, ...metadata });
  }

  /**
   * Log with request context
   */
  withRequest(req: any): EnhancedLogger {
    return this.child({
      correlationId: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  // Standard logging methods
  error(message: string, metadata?: any): void {
    this.logger.error(message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.logger.warn(message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.logger.info(message, metadata);
  }

  http(message: string, metadata?: any): void {
    this.logger.http(message, metadata);
  }

  debug(message: string, metadata?: any): void {
    this.logger.debug(message, metadata);
  }

  /**
   * Log audit event
   */
  audit(action: string, metadata: Record<string, any>): void {
    this.logger.info(`AUDIT: ${action}`, {
      ...metadata,
      auditEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log performance metric
   */
  performance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.logger.info(`PERF: ${operation}`, {
      ...metadata,
      duration,
      performanceEvent: true,
    });
  }

  /**
   * Log business event
   */
  business(event: string, metadata: Record<string, any>): void {
    this.logger.info(`BUSINESS: ${event}`, {
      ...metadata,
      businessEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log security event
   */
  security(event: string, metadata: Record<string, any>): void {
    this.logger.warn(`SECURITY: ${event}`, {
      ...metadata,
      securityEvent: true,
      timestamp: new Date().toISOString(),
    });
  }
}

// Create enhanced logger instance
const enhancedLogger = new EnhancedLogger(logger);

// Export both for compatibility
export default enhancedLogger;
export { logger as winstonLogger, EnhancedLogger };
