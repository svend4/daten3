/**
 * Distributed Tracing Middleware
 * Request tracing and performance monitoring
 * Simplified implementation without OpenTelemetry
 */

import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import logger from '../utils/logger.js';

/**
 * Span types
 */
export enum SpanType {
  HTTP_REQUEST = 'http.request',
  DATABASE_QUERY = 'database.query',
  REDIS_OPERATION = 'redis.operation',
  EXTERNAL_API = 'external.api',
  BUSINESS_LOGIC = 'business.logic',
}

/**
 * Span interface
 */
interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  type: SpanType;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  error?: string;
}

/**
 * Trace interface
 */
interface Trace {
  traceId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  spans: Span[];
  tags: Record<string, any>;
}

/**
 * Tracing statistics
 */
const stats = {
  totalTraces: 0,
  totalSpans: 0,
  avgTraceDuration: 0,
  bySpanType: new Map<SpanType, {
    count: number;
    avgDuration: number;
    errors: number;
  }>(),
  recentTraces: [] as Trace[],
};

/**
 * Active traces storage
 */
const activeTraces = new Map<string, Trace>();
const activeSpans = new Map<string, Span>();

/**
 * Generate trace ID
 */
const generateTraceId = (): string => {
  return `trace-${randomBytes(16).toString('hex')}`;
};

/**
 * Generate span ID
 */
const generateSpanId = (): string => {
  return `span-${randomBytes(8).toString('hex')}`;
};

/**
 * Distributed tracing middleware
 */
export const distributedTracingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate or extract trace ID
  const traceId = (req.headers['x-trace-id'] as string) || generateTraceId();
  const spanId = generateSpanId();

  // Create trace
  const trace: Trace = {
    traceId,
    startTime: Date.now(),
    spans: [],
    tags: {
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    },
  };

  // Create root span for HTTP request
  const rootSpan: Span = {
    spanId,
    traceId,
    name: `${req.method} ${req.originalUrl || req.url}`,
    type: SpanType.HTTP_REQUEST,
    startTime: Date.now(),
    tags: {
      'http.method': req.method,
      'http.url': req.originalUrl || req.url,
      'http.host': req.hostname,
    },
  };

  // Store active trace and span
  activeTraces.set(traceId, trace);
  activeSpans.set(spanId, rootSpan);
  trace.spans.push(rootSpan);

  // Attach trace context to request
  (req as any).tracing = {
    traceId,
    spanId,
    startSpan: (name: string, type: SpanType, tags?: Record<string, any>) => {
      return startSpan(traceId, spanId, name, type, tags);
    },
    endSpan: (childSpanId: string, error?: string) => {
      endSpan(childSpanId, error);
    },
  };

  // Set response headers
  res.setHeader('X-Trace-Id', traceId);
  res.setHeader('X-Span-Id', spanId);

  // Hook into response finish
  res.on('finish', () => {
    // End root span
    rootSpan.endTime = Date.now();
    rootSpan.duration = rootSpan.endTime - rootSpan.startTime;
    rootSpan.tags['http.status_code'] = res.statusCode;

    // End trace
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;

    // Update statistics
    updateStats(trace);

    // Clean up
    activeTraces.delete(traceId);
    activeSpans.delete(spanId);

    logger.debug(`Trace completed: ${traceId} (${trace.duration}ms, ${trace.spans.length} spans)`);
  });

  next();
};

/**
 * Start a new span
 */
export const startSpan = (
  traceId: string,
  parentSpanId: string,
  name: string,
  type: SpanType,
  tags?: Record<string, any>
): string => {
  const spanId = generateSpanId();
  const trace = activeTraces.get(traceId);

  if (!trace) {
    logger.warn(`Trace not found: ${traceId}`);
    return spanId;
  }

  const span: Span = {
    spanId,
    traceId,
    parentSpanId,
    name,
    type,
    startTime: Date.now(),
    tags: tags || {},
  };

  trace.spans.push(span);
  activeSpans.set(spanId, span);

  return spanId;
};

/**
 * End a span
 */
export const endSpan = (spanId: string, error?: string): void => {
  const span = activeSpans.get(spanId);

  if (!span) {
    logger.warn(`Span not found: ${spanId}`);
    return;
  }

  span.endTime = Date.now();
  span.duration = span.endTime - span.startTime;

  if (error) {
    span.error = error;
    span.tags['error'] = true;
  }

  activeSpans.delete(spanId);
};

/**
 * Update statistics
 */
const updateStats = (trace: Trace): void => {
  stats.totalTraces++;
  stats.totalSpans += trace.spans.length;

  // Update average trace duration
  stats.avgTraceDuration = Math.round(
    (stats.avgTraceDuration * (stats.totalTraces - 1) + (trace.duration || 0)) / stats.totalTraces
  );

  // Update span type statistics
  for (const span of trace.spans) {
    let typeStats = stats.bySpanType.get(span.type);

    if (!typeStats) {
      typeStats = {
        count: 0,
        avgDuration: 0,
        errors: 0,
      };
      stats.bySpanType.set(span.type, typeStats);
    }

    typeStats.count++;
    if (span.error) {
      typeStats.errors++;
    }

    if (span.duration) {
      typeStats.avgDuration = Math.round(
        (typeStats.avgDuration * (typeStats.count - 1) + span.duration) / typeStats.count
      );
    }
  }

  // Add to recent traces
  stats.recentTraces.push(trace);

  // Keep only last 50 traces
  if (stats.recentTraces.length > 50) {
    stats.recentTraces = stats.recentTraces.slice(-50);
  }
};

/**
 * Get tracing statistics
 */
export const getDistributedTracingStats = () => {
  const bySpanType: Record<string, any> = {};
  for (const [type, typeStats] of stats.bySpanType.entries()) {
    bySpanType[type] = { ...typeStats };
  }

  return {
    totalTraces: stats.totalTraces,
    totalSpans: stats.totalSpans,
    avgTraceDuration: stats.avgTraceDuration,
    avgSpansPerTrace: stats.totalTraces > 0 ? Math.round(stats.totalSpans / stats.totalTraces) : 0,
    bySpanType,
    recentTraces: stats.recentTraces.slice(-10).map(trace => ({
      traceId: trace.traceId,
      duration: trace.duration,
      spanCount: trace.spans.length,
      method: trace.tags.method,
      url: trace.tags.url,
      timestamp: new Date(trace.startTime),
    })),
  };
};

/**
 * Reset tracing statistics
 */
export const resetDistributedTracingStats = (): void => {
  stats.totalTraces = 0;
  stats.totalSpans = 0;
  stats.avgTraceDuration = 0;
  stats.bySpanType.clear();
  stats.recentTraces = [];
};

/**
 * Helper: Get trace context from request
 */
export const getTraceContext = (req: Request) => {
  return (req as any).tracing;
};
