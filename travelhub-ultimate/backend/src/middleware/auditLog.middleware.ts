/**
 * Audit Logging Middleware
 * Comprehensive audit trail for compliance and security
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import logger from '../utils/logger.js';

/**
 * Audit event types
 */
enum AuditEventType {
  // Authentication events
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',

  // Data events
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',

  // Admin events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',

  // Financial events
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_ISSUED = 'REFUND_ISSUED',
  PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',

  // System events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SECURITY_ALERT = 'SECURITY_ALERT',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
}

/**
 * Audit log entry
 */
interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  resource?: string;
  resourceId?: string;
  action: string;
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  changes?: any;
  metadata?: any;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  timestamp: Date;
}

/**
 * Audit log statistics
 */
interface AuditStats {
  total: number;
  byEventType: Map<AuditEventType, number>;
  byUser: Map<string, number>;
  byResource: Map<string, number>;
  failures: number;
  successes: number;
}

const auditStats: AuditStats = {
  total: 0,
  byEventType: new Map(),
  byUser: new Map(),
  byResource: new Map(),
  failures: 0,
  successes: 0,
};

/**
 * In-memory audit log buffer (for performance)
 */
const auditBuffer: AuditLogEntry[] = [];
const BUFFER_SIZE = 100;
const FLUSH_INTERVAL = 5000; // 5 seconds

/**
 * Sensitive fields to redact from audit logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'creditCard',
  'cvv',
  'ssn',
  'authorization',
];

/**
 * Redact sensitive data
 */
const redactSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  const redacted = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      redacted[key] = '***REDACTED***';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
};

/**
 * Create audit log entry
 */
export const createAuditLog = async (entry: Partial<AuditLogEntry>): Promise<void> => {
  try {
    const logEntry: AuditLogEntry = {
      eventType: entry.eventType || AuditEventType.READ,
      userId: entry.userId,
      userEmail: entry.userEmail,
      resource: entry.resource,
      resourceId: entry.resourceId,
      action: entry.action || 'UNKNOWN',
      method: entry.method,
      path: entry.path,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      requestId: entry.requestId,
      changes: entry.changes ? redactSensitiveData(entry.changes) : undefined,
      metadata: entry.metadata ? redactSensitiveData(entry.metadata) : undefined,
      status: entry.status || 'SUCCESS',
      errorMessage: entry.errorMessage,
      timestamp: entry.timestamp || new Date(),
    };

    // Update statistics
    auditStats.total++;
    if (entry.status === 'SUCCESS') {
      auditStats.successes++;
    } else {
      auditStats.failures++;
    }

    const eventCount = auditStats.byEventType.get(logEntry.eventType) || 0;
    auditStats.byEventType.set(logEntry.eventType, eventCount + 1);

    if (entry.userId) {
      const userCount = auditStats.byUser.get(entry.userId) || 0;
      auditStats.byUser.set(entry.userId, userCount + 1);
    }

    if (entry.resource) {
      const resourceCount = auditStats.byResource.get(entry.resource) || 0;
      auditStats.byResource.set(entry.resource, resourceCount + 1);
    }

    // Add to buffer
    auditBuffer.push(logEntry);

    // Flush if buffer is full
    if (auditBuffer.length >= BUFFER_SIZE) {
      await flushAuditLogs();
    }
  } catch (error: any) {
    logger.error('Failed to create audit log:', error);
  }
};

/**
 * Flush audit logs to database
 */
const flushAuditLogs = async (): Promise<void> => {
  if (auditBuffer.length === 0) return;

  try {
    const logsToFlush = auditBuffer.splice(0, auditBuffer.length);

    // In a real implementation, you'd save to database
    // For now, we'll log to file
    for (const log of logsToFlush) {
      logger.info('AUDIT_LOG', {
        ...log,
        timestamp: log.timestamp.toISOString(),
      });
    }

    // Example Prisma implementation (requires audit_logs table):
    // await prisma.auditLog.createMany({
    //   data: logsToFlush.map(log => ({
    //     eventType: log.eventType,
    //     userId: log.userId,
    //     userEmail: log.userEmail,
    //     resource: log.resource,
    //     resourceId: log.resourceId,
    //     action: log.action,
    //     method: log.method,
    //     path: log.path,
    //     ipAddress: log.ipAddress,
    //     userAgent: log.userAgent,
    //     requestId: log.requestId,
    //     changes: log.changes,
    //     metadata: log.metadata,
    //     status: log.status,
    //     errorMessage: log.errorMessage,
    //     timestamp: log.timestamp,
    //   })),
    // });
  } catch (error: any) {
    logger.error('Failed to flush audit logs:', error);
  }
};

/**
 * Start periodic flush
 */
let flushInterval: NodeJS.Timeout | null = null;

export const startAuditLogFlushing = (): void => {
  if (flushInterval) return;

  flushInterval = setInterval(() => {
    flushAuditLogs().catch(err => {
      logger.error('Audit log flush error:', err);
    });
  }, FLUSH_INTERVAL);

  logger.info('Audit log flushing started');
};

/**
 * Stop periodic flush
 */
export const stopAuditLogFlushing = async (): Promise<void> => {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }

  // Flush remaining logs
  await flushAuditLogs();

  logger.info('Audit log flushing stopped');
};

/**
 * Audit middleware for automatic logging
 */
export const auditMiddleware = (options: {
  eventType?: AuditEventType;
  resource?: string;
  includeBody?: boolean;
  includeQuery?: boolean;
} = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;
    const startTime = Date.now();

    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let responseBody: any;
    let responseSent = false;

    // Override response methods to capture data
    res.json = function (data: any) {
      if (!responseSent) {
        responseBody = data;
        responseSent = true;
        logAuditEntry();
      }
      return originalJson(data);
    };

    res.send = function (data: any) {
      if (!responseSent) {
        responseBody = data;
        responseSent = true;
        logAuditEntry();
      }
      return originalSend(data);
    };

    const logAuditEntry = async () => {
      const duration = Date.now() - startTime;
      const status = res.statusCode < 400 ? 'SUCCESS' : 'FAILURE';

      await createAuditLog({
        eventType: options.eventType || getEventTypeFromMethod(req.method),
        userId: user?.id,
        userEmail: user?.email,
        resource: options.resource || extractResourceFromPath(req.path),
        resourceId: req.params.id,
        action: `${req.method} ${req.path}`,
        method: req.method,
        path: req.path,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
        changes: options.includeBody ? req.body : undefined,
        metadata: {
          query: options.includeQuery ? req.query : undefined,
          statusCode: res.statusCode,
          duration,
        },
        status,
        errorMessage: status === 'FAILURE' ? responseBody?.error || responseBody?.message : undefined,
      });
    };

    next();
  };
};

/**
 * Get event type from HTTP method
 */
const getEventTypeFromMethod = (method: string): AuditEventType => {
  switch (method.toUpperCase()) {
    case 'POST':
      return AuditEventType.CREATE;
    case 'GET':
      return AuditEventType.READ;
    case 'PUT':
    case 'PATCH':
      return AuditEventType.UPDATE;
    case 'DELETE':
      return AuditEventType.DELETE;
    default:
      return AuditEventType.READ;
  }
};

/**
 * Extract resource name from path
 */
const extractResourceFromPath = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  // Remove 'api' prefix if present
  if (parts[0] === 'api') parts.shift();
  // Return first segment as resource name
  return parts[0] || 'unknown';
};

/**
 * Log authentication event
 */
export const logAuthEvent = async (
  eventType: AuditEventType.LOGIN | AuditEventType.LOGOUT | AuditEventType.LOGIN_FAILED,
  req: Request,
  userId?: string,
  userEmail?: string,
  errorMessage?: string
): Promise<void> => {
  await createAuditLog({
    eventType,
    userId,
    userEmail,
    resource: 'auth',
    action: eventType,
    method: req.method,
    path: req.path,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.id,
    status: errorMessage ? 'FAILURE' : 'SUCCESS',
    errorMessage,
  });
};

/**
 * Log data modification event
 */
export const logDataChange = async (
  eventType: AuditEventType.CREATE | AuditEventType.UPDATE | AuditEventType.DELETE,
  resource: string,
  resourceId: string,
  userId: string,
  changes?: any,
  metadata?: any
): Promise<void> => {
  await createAuditLog({
    eventType,
    userId,
    resource,
    resourceId,
    action: `${eventType} ${resource}`,
    changes,
    metadata,
    status: 'SUCCESS',
  });
};

/**
 * Log security alert
 */
export const logSecurityAlert = async (
  message: string,
  req: Request,
  metadata?: any
): Promise<void> => {
  await createAuditLog({
    eventType: AuditEventType.SECURITY_ALERT,
    userId: (req as any).user?.id,
    resource: 'security',
    action: message,
    method: req.method,
    path: req.path,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.id,
    metadata,
    status: 'FAILURE',
    errorMessage: message,
  });
};

/**
 * Get audit statistics
 */
export const getAuditStats = () => {
  const byEventType: Record<string, number> = {};
  for (const [type, count] of auditStats.byEventType.entries()) {
    byEventType[type] = count;
  }

  const byUser: Record<string, number> = {};
  for (const [userId, count] of auditStats.byUser.entries()) {
    byUser[userId] = count;
  }

  const byResource: Record<string, number> = {};
  for (const [resource, count] of auditStats.byResource.entries()) {
    byResource[resource] = count;
  }

  return {
    total: auditStats.total,
    successes: auditStats.successes,
    failures: auditStats.failures,
    successRate: auditStats.total > 0 ? Math.round((auditStats.successes / auditStats.total) * 100) : 0,
    byEventType,
    byUser,
    byResource,
    bufferSize: auditBuffer.length,
  };
};

/**
 * Reset audit statistics
 */
export const resetAuditStats = (): void => {
  auditStats.total = 0;
  auditStats.successes = 0;
  auditStats.failures = 0;
  auditStats.byEventType.clear();
  auditStats.byUser.clear();
  auditStats.byResource.clear();
};

export { AuditEventType };
export default auditMiddleware;
