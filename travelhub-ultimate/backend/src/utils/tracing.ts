/**
 * OpenTelemetry APM Instrumentation
 * Distributed tracing for performance monitoring
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import logger from './logger.js';

/**
 * Initialize OpenTelemetry tracing
 */
export function initializeTracing() {
  // Only enable in production or when explicitly enabled
  const tracingEnabled = process.env.OTEL_ENABLED === 'true';

  if (!tracingEnabled) {
    logger.info('OpenTelemetry tracing is disabled');
    return null;
  }

  try {
    // Set diagnostic logger for debugging
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }

    // Configure Jaeger exporter
    const jaegerExporter = new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      // Agent endpoint: 'localhost:6832'
    });

    // Initialize SDK
    const sdk = new NodeSDK({
      serviceName: 'travelhub-api',
      traceExporter: jaegerExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Customize auto-instrumentations
          '@opentelemetry/instrumentation-http': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-pg': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-redis': {
            enabled: true,
          },
        }),
      ],
    });

    // Start the SDK
    sdk.start();

    logger.info('OpenTelemetry tracing initialized', {
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      serviceName: 'travelhub-api',
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk.shutdown();
        logger.info('OpenTelemetry SDK shut down successfully');
      } catch (error) {
        logger.error('Error shutting down OpenTelemetry SDK', { error });
      }
    });

    return sdk;
  } catch (error: any) {
    logger.error('Failed to initialize OpenTelemetry tracing', {
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
}

/**
 * Create custom span for manual instrumentation
 */
export function createSpan(
  tracer: any,
  name: string,
  attributes?: Record<string, any>
): any {
  if (!tracer) return null;

  const span = tracer.startSpan(name, {
    attributes: {
      ...attributes,
      'app.service': 'travelhub-api',
    },
  });

  return span;
}

/**
 * End span with optional error
 */
export function endSpan(span: any, error?: Error): void {
  if (!span) return;

  if (error) {
    span.recordException(error);
    span.setStatus({
      code: 2, // ERROR
      message: error.message,
    });
  }

  span.end();
}
