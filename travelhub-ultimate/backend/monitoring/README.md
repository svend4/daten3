# TravelHub Monitoring Stack

Complete monitoring and observability solution for TravelHub using Prometheus, Grafana, and Alertmanager.

## Overview

This monitoring stack provides:

- **Metrics Collection**: Prometheus scrapes metrics from the API
- **Visualization**: Grafana dashboards for metrics visualization
- **Alerting**: Alertmanager for alert routing and notification
- **System Metrics**: Node Exporter for system-level metrics
- **Database Metrics**: Postgres Exporter for database monitoring
- **Cache Metrics**: Redis Exporter for cache monitoring

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- TravelHub API running on localhost:5000

### Start Monitoring Stack

```bash
cd monitoring
docker-compose up -d
```

This will start:
- Prometheus on http://localhost:9090
- Grafana on http://localhost:3000
- Alertmanager on http://localhost:9093
- Node Exporter on http://localhost:9100
- Redis Exporter on http://localhost:9121
- Postgres Exporter on http://localhost:9187

### Access Grafana

1. Navigate to http://localhost:3000
2. Login with:
   - Username: `admin`
   - Password: `admin`
3. Add Prometheus data source:
   - URL: `http://prometheus:9090`
4. Import dashboards from `/grafana` directory

### Access Prometheus

1. Navigate to http://localhost:9090
2. View metrics and execute PromQL queries
3. Check alert rules status

### Access Alertmanager

1. Navigate to http://localhost:9093
2. View active alerts
3. Manage alert silences

## Architecture

```
┌─────────────┐
│ TravelHub   │ (Port 5000)
│ API Server  │
└──────┬──────┘
       │ /metrics
       ▼
┌─────────────┐
│ Prometheus  │ (Port 9090)
│             │ Scrapes metrics every 15s
└──────┬──────┘
       │
       ├──────────► Alertmanager (Port 9093)
       │            Routes alerts to Slack/Email/PagerDuty
       │
       └──────────► Grafana (Port 3000)
                    Visualizes metrics
```

## Metrics Exposed

### HTTP Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_in_progress` - Active requests

### Business Metrics
- `bookings_total` - Total bookings
- `booking_revenue_total` - Total revenue
- `searches_total` - Total searches
- `users_total` - Total registered users
- `active_users` - Currently active users

### Database Metrics
- `database_query_duration_seconds` - Query duration
- `database_connections_active` - Active connections
- `database_queries_total` - Total queries

### Cache Metrics
- `cache_hits_total` - Cache hits
- `cache_misses_total` - Cache misses
- `cache_operation_duration_seconds` - Operation duration

### Queue Metrics
- `queue_jobs_total` - Total queue jobs
- `queue_job_duration_seconds` - Job processing duration
- `queue_size` - Current queue size

### Error Metrics
- `errors_total` - Total errors by type and severity
- `uncaught_exceptions_total` - Uncaught exceptions
- `rate_limit_exceeded_total` - Rate limit violations

## Dashboards

### 1. TravelHub Overview
**File**: `grafana/travelhub-overview-dashboard.json`

Panels:
- HTTP Request Rate
- HTTP Request Duration (p95)
- Active Users
- Total Users
- Bookings Rate
- Error Rate
- Cache Hit Rate
- Database Query Duration
- External API Call Duration
- Queue Size
- Revenue (Total)

### 2. API Performance
**File**: `grafana/api-performance-dashboard.json`

Panels:
- Request Rate by Endpoint
- Response Time Percentiles (p50, p95, p99)
- HTTP Status Codes
- Requests in Progress
- Authentication Success Rate
- Rate Limit Violations
- Search Operations

## Alert Rules

### Critical Alerts
- **APIDown**: API is unreachable for >2 minutes
- **HighErrorRate**: Error rate >5% for >5 minutes
- **VerySlowResponseTime**: p99 response time >3s
- **LowDatabaseConnections**: No active database connections

### Warning Alerts
- **SlowResponseTime**: p95 response time >1s
- **HighRequestRate**: Request rate >1000 req/s
- **SlowDatabaseQueries**: p95 query time >0.5s
- **LowCacheHitRate**: Cache hit rate <50%
- **HighQueueSize**: Queue size >1000 items
- **HighCPUUsage**: CPU usage >80%
- **HighMemoryUsage**: Memory >2GB

### Business Alerts
- **LowBookingRate**: Booking rate <0.1 bookings/s
- **HighCancellationRate**: Cancellation rate >20%
- **RevenueDropDetected**: Revenue drop vs 24h ago
- **NoNewRegistrations**: No registrations in 4h

## Alerting Channels

### Slack
Configure webhook in `alertmanager/alertmanager.yml`:

```yaml
slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
```

Channels:
- `#travelhub-critical` - Critical alerts
- `#travelhub-warnings` - Warning alerts
- `#travelhub-info` - Info alerts

### Email
Configure SMTP settings in `alertmanager/alertmanager.yml`:

```yaml
email_configs:
  - to: 'oncall@travelhub.com'
    from: 'alerts@travelhub.com'
    smarthost: 'smtp.gmail.com:587'
    auth_username: 'alerts@travelhub.com'
    auth_password: 'your-password'
```

### PagerDuty
Configure service key in `alertmanager/alertmanager.yml`:

```yaml
pagerduty_configs:
  - service_key: 'your-pagerduty-service-key'
```

## PromQL Queries

### Common Queries

**Request Rate:**
```promql
rate(http_requests_total[5m])
```

**Error Rate:**
```promql
rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])
```

**p95 Response Time:**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Cache Hit Rate:**
```promql
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

**Active Users:**
```promql
active_users
```

## Production Deployment

### Kubernetes Deployment

1. Deploy Prometheus Operator:
```bash
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml
```

2. Create ServiceMonitor for TravelHub:
```yaml
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

3. Deploy Grafana with dashboards:
```bash
kubectl apply -f grafana-deployment.yaml
```

### Cloud Monitoring

#### AWS CloudWatch
Use CloudWatch as additional monitoring layer:
- Enable Container Insights for ECS/EKS
- Create CloudWatch dashboard
- Set up CloudWatch alarms

#### DataDog
Integrate with DataDog APM:
```bash
npm install dd-trace
```

#### New Relic
Integrate with New Relic APM:
```bash
npm install newrelic
```

## Maintenance

### Backup Prometheus Data

```bash
docker exec travelhub-prometheus tar czf /tmp/prometheus-backup.tar.gz /prometheus
docker cp travelhub-prometheus:/tmp/prometheus-backup.tar.gz ./backups/
```

### Restore Prometheus Data

```bash
docker cp ./backups/prometheus-backup.tar.gz travelhub-prometheus:/tmp/
docker exec travelhub-prometheus tar xzf /tmp/prometheus-backup.tar.gz -C /
docker restart travelhub-prometheus
```

### Update Dashboards

1. Edit JSON files in `/grafana` directory
2. Reload Grafana:
```bash
docker restart travelhub-grafana
```

### Update Alert Rules

1. Edit YAML files in `/prometheus/alerts` directory
2. Reload Prometheus:
```bash
curl -X POST http://localhost:9090/-/reload
```

## Troubleshooting

### Prometheus Not Scraping Metrics

1. Check target status: http://localhost:9090/targets
2. Verify API is running: http://localhost:5000/metrics
3. Check Prometheus logs:
```bash
docker logs travelhub-prometheus
```

### Grafana Not Showing Data

1. Verify Prometheus data source is configured
2. Check Prometheus URL: `http://prometheus:9090`
3. Test data source connection in Grafana

### Alerts Not Firing

1. Check alert rules: http://localhost:9090/alerts
2. Verify Alertmanager config:
```bash
docker exec travelhub-alertmanager amtool check-config /etc/alertmanager/alertmanager.yml
```
3. Check Alertmanager logs:
```bash
docker logs travelhub-alertmanager
```

## Best Practices

1. **Metric Naming**: Follow Prometheus naming conventions
2. **Label Cardinality**: Keep label cardinality low (<100 unique values)
3. **Scrape Intervals**: Balance between freshness and overhead
4. **Retention**: Set appropriate retention period (default: 30 days)
5. **Dashboard Organization**: Group related metrics together
6. **Alert Tuning**: Avoid alert fatigue with proper thresholds
7. **Documentation**: Document custom metrics and dashboards

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

## Support

For questions or issues:
1. Check Prometheus/Grafana logs
2. Review alert rules configuration
3. Verify network connectivity
4. Contact DevOps team
