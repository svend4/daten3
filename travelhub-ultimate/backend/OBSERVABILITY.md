# TravelHub Observability Guide

Complete guide to monitoring, logging, and tracing for TravelHub.

## Overview

TravelHub uses a three-pillar observability approach:

1. **Metrics** - Prometheus + Grafana
2. **Logs** - Winston + Loki + Promtail
3. **Traces** - OpenTelemetry + Jaeger

## Quick Start

### Start Full Observability Stack

```bash
cd monitoring
docker-compose -f observability-stack.yml up -d
```

This starts:
- **Prometheus** (http://localhost:9090) - Metrics collection
- **Grafana** (http://localhost:3000) - Visualization
- **Jaeger** (http://localhost:16686) - Distributed tracing
- **Loki** (http://localhost:3100) - Log aggregation
- **Alertmanager** (http://localhost:9093) - Alert routing

### Configure Application

Add to `.env`:

```env
# Metrics
PROMETHEUS_ENABLED=true

# Tracing
OTEL_ENABLED=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Logging
LOG_LEVEL=info
ELASTICSEARCH_URL=http://localhost:9200  # Optional

# APM
APM_ENABLED=true
```

## 1. Metrics (Prometheus + Grafana)

### Available Metrics

#### HTTP Metrics
```
http_requests_total
http_request_duration_seconds
http_requests_in_progress
```

#### Business Metrics
```
bookings_total{status, type}
booking_revenue_total{currency}
searches_total{type}
users_total
active_users
```

#### Database Metrics
```
database_query_duration_seconds{operation, table}
database_connections_active
database_queries_total{operation, table}
```

#### Cache Metrics
```
cache_hits_total{cache_name}
cache_misses_total{cache_name}
cache_operation_duration_seconds{operation, cache_name}
```

#### Queue Metrics
```
queue_jobs_total{queue, status}
queue_job_duration_seconds{queue, job_type}
queue_size{queue}
```

### Dashboards

#### TravelHub Overview
- HTTP request rate and duration
- Active and total users
- Bookings rate and revenue
- Error rates
- Cache performance
- Database performance

#### API Performance
- Request rate by endpoint
- Response time percentiles (p50, p95, p99)
- HTTP status code distribution
- Authentication success rate
- Rate limit violations

### Custom Metrics

Add custom metrics in code:

```typescript
import { metricsService } from '@/services/metrics.service';

// Track custom event
metricsService.trackSearch('flight');
metricsService.trackBooking('completed', 'hotel', 500, 'USD');

// Track external API call
metricsService.trackExternalApiCall('travelpayouts', 'success', 0.5);

// Track error
metricsService.trackError('ValidationError', 'low');
```

## 2. Logging (Winston + Loki)

### Log Levels

- **error**: Error messages
- **warn**: Warning messages
- **info**: Informational messages
- **http**: HTTP request logs
- **debug**: Debug messages

### Enhanced Logging

```typescript
import logger from '@/utils/enhancedLogger';

// Basic logging
logger.info('User registered', { userId: '123' });
logger.error('Payment failed', { orderId: 'ABC', error });

// With correlation ID
const correlatedLogger = logger.withCorrelation(req.id);
correlatedLogger.info('Processing request');

// With user context
const userLogger = logger.withUser(userId);
userLogger.info('Profile updated');

// With request context
const requestLogger = logger.withRequest(req);
requestLogger.info('Handling request');

// Audit logging
logger.audit('user.login', {
  userId: '123',
  ip: req.ip,
  success: true,
});

// Performance logging
logger.performance('database.query', 150, {
  operation: 'select',
  table: 'users',
});

// Business event logging
logger.business('booking.completed', {
  bookingId: 'ABC',
  amount: 500,
  userId: '123',
});

// Security event logging
logger.security('auth.failed', {
  userId: '123',
  ip: req.ip,
  reason: 'invalid_password',
});
```

### Log Files

Logs are stored with daily rotation:

```
logs/
├── combined-2024-12-22.log     # All logs
├── error-2024-12-22.log        # Errors only
├── http-2024-12-22.log         # HTTP requests
└── audit-2024-12-22.log        # Audit events
```

Retention:
- Combined logs: 14 days
- Error logs: 14 days
- HTTP logs: 7 days
- Audit logs: 30 days

### Querying Logs in Loki

Via Grafana Explore:

```logql
# All logs from travelhub-api
{job="travelhub-api"}

# Error logs only
{job="travelhub-api", level="error"}

# Logs with correlation ID
{job="travelhub-api"} |= "correlationId"

# Logs in time range
{job="travelhub-api"} | json | level="error" | line_format "{{.message}}"
```

## 3. Tracing (OpenTelemetry + Jaeger)

### Automatic Instrumentation

OpenTelemetry automatically instruments:
- HTTP requests (incoming and outgoing)
- Express routes
- PostgreSQL queries
- Redis operations

### Manual Instrumentation

```typescript
import { apmService } from '@/services/apm.service';

// In controller/route handler
const transactionId = req.apmTransactionId;

// Track database query
const spanId = apmService.startSpan(transactionId, 'db.findUser', 'db', {
  operation: 'select',
  table: 'users',
});

try {
  const user = await prisma.user.findUnique({ where: { id } });
  apmService.endSpan(transactionId, spanId, { status: 'success' });
  return user;
} catch (error) {
  apmService.endSpan(transactionId, spanId, {
    status: 'error',
    error: error.message,
  });
  throw error;
}
```

### Using Helpers

```typescript
import { trackDatabaseQuery, trackExternalApiCall } from '@/middleware/apm.middleware';

// Track database query
const user = await trackDatabaseQuery(req, 'select', 'users', async () => {
  return await prisma.user.findUnique({ where: { id } });
});

// Track external API call
const flights = await trackExternalApiCall(req, 'travelpayouts', async () => {
  return await axios.get('https://api.travelpayouts.com/flights');
});
```

### Viewing Traces in Jaeger

1. Open http://localhost:16686
2. Select service: `travelhub-api`
3. Click "Find Traces"
4. Click on a trace to view details:
   - Timeline of all operations
   - Span durations
   - Tags and logs
   - Service dependencies

## 4. Alerting

### Alert Rules

#### Critical Alerts
- **APIDown**: API unreachable >2min
- **HighErrorRate**: Error rate >5%
- **VerySlowResponseTime**: p99 >3s
- **LowDatabaseConnections**: No DB connections

#### Warning Alerts
- **SlowResponseTime**: p95 >1s
- **HighRequestRate**: >1000 req/s
- **LowCacheHitRate**: <50%
- **HighQueueSize**: >1000 items

#### Business Alerts
- **LowBookingRate**: <0.1 bookings/s
- **HighCancellationRate**: >20%
- **RevenueDropDetected**: Revenue drop vs 24h ago

### Alert Channels

Configured in `monitoring/alertmanager/alertmanager.yml`:

- **Slack** - Real-time notifications
- **Email** - Critical alerts
- **PagerDuty** - On-call rotations

### Silencing Alerts

```bash
# Silence an alert for 1 hour
curl -X POST http://localhost:9093/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [{"name": "alertname", "value": "HighErrorRate"}],
    "startsAt": "2024-12-22T10:00:00Z",
    "endsAt": "2024-12-22T11:00:00Z",
    "comment": "Deployment in progress"
  }'
```

## 5. Best Practices

### Logging

1. **Use structured logging**: Always include context
   ```typescript
   logger.info('User action', { userId, action, result });
   ```

2. **Include correlation IDs**: Track requests across services
   ```typescript
   logger.withCorrelation(req.id).info('Processing');
   ```

3. **Log levels appropriately**:
   - `error`: Actual errors requiring action
   - `warn`: Potential issues
   - `info`: Important business events
   - `debug`: Detailed diagnostic info

4. **Don't log sensitive data**: Passwords, tokens, PII

5. **Use audit logging**: Track security-relevant events

### Metrics

1. **Use labels wisely**: Keep cardinality low (<100 unique values)

2. **Name consistently**: Follow Prometheus conventions
   - Use snake_case
   - Include units (e.g., `_seconds`, `_bytes`)

3. **Use histograms for durations**: Better than gauges/counters

4. **Track business metrics**: Not just technical metrics

### Tracing

1. **Use meaningful span names**: Operation-oriented
   ```typescript
   apmService.startSpan(txId, 'db.findUser', 'db', {...});
   ```

2. **Add relevant tags**: Help with filtering and analysis

3. **Limit span count**: Too many spans = overhead

4. **Don't trace everything**: Focus on critical paths

### Alerting

1. **Alert on symptoms, not causes**: User-facing issues

2. **Make alerts actionable**: Include context and next steps

3. **Avoid alert fatigue**: Tune thresholds carefully

4. **Use inhibition rules**: Prevent cascading alerts

5. **Document runbooks**: Link from alert annotations

## 6. Troubleshooting

### High CPU/Memory

1. Check Prometheus dashboard for resource metrics
2. Look at active transactions in Jaeger
3. Review slow queries in logs
4. Check queue sizes

### Slow Requests

1. View trace in Jaeger to identify bottleneck
2. Check database query performance
3. Review cache hit rates
4. Look for external API timeouts

### Missing Metrics

1. Verify Prometheus is scraping: http://localhost:9090/targets
2. Check application logs for errors
3. Verify metrics endpoint: http://localhost:5000/metrics

### Missing Logs

1. Check Promtail status: http://localhost:9080/targets
2. Verify log files are being written
3. Check Loki ingestion: http://localhost:3100/ready

### Missing Traces

1. Verify OTEL_ENABLED=true
2. Check Jaeger agent connection
3. Review application startup logs

## 7. Production Deployment

### Kubernetes

```yaml
# ServiceMonitor for Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: travelhub-api
spec:
  selector:
    matchLabels:
      app: travelhub-api
  endpoints:
    - port: metrics
      path: /metrics
      interval: 15s
```

### Cloud Platforms

#### AWS
- Use CloudWatch for metrics
- Use X-Ray for tracing
- Use CloudWatch Logs for logging

#### GCP
- Use Cloud Monitoring
- Use Cloud Trace
- Use Cloud Logging

#### Azure
- Use Application Insights
- Automatic instrumentation available

### Third-Party APM

#### DataDog
```bash
npm install dd-trace
```

```typescript
import tracer from 'dd-trace';
tracer.init();
```

#### New Relic
```bash
npm install newrelic
```

```typescript
require('newrelic');
```

## 8. Maintenance

### Backup Prometheus Data

```bash
docker exec travelhub-prometheus tar czf /tmp/prometheus-backup.tar.gz /prometheus
docker cp travelhub-prometheus:/tmp/prometheus-backup.tar.gz ./backups/
```

### Clean Old Logs

```bash
# Automatically handled by Winston daily rotation
# Manual cleanup:
find logs/ -name "*.log.gz" -mtime +30 -delete
```

### Update Dashboards

1. Edit JSON in `monitoring/grafana/`
2. Reload Grafana: `docker restart travelhub-grafana`

### Update Alert Rules

1. Edit YAML in `monitoring/prometheus/alerts/`
2. Reload Prometheus: `curl -X POST http://localhost:9090/-/reload`

## 9. Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Winston Documentation](https://github.com/winstonjs/winston)

## 10. Support

For questions or issues:

1. Check this documentation
2. Review dashboard and alert configurations
3. Verify all services are running
4. Check application logs
5. Contact DevOps team
