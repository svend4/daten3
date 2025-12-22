# Load Testing with k6

Load and performance tests for TravelHub API using [k6](https://k6.io/).

## Installation

### macOS
```bash
brew install k6
```

### Linux
```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows
```bash
choco install k6
```

### Docker
```bash
docker pull grafana/k6
```

## Running Tests

### Basic Load Test
Tests typical user behavior with realistic load patterns:
```bash
k6 run tests/load/api-load-test.js
```

### Stress Test
Tests system behavior under extreme load (100-300 concurrent users):
```bash
k6 run tests/load/stress-test.js
```

### Spike Test
Tests system behavior under sudden traffic spikes:
```bash
k6 run tests/load/spike-test.js
```

## Custom Configuration

### Override VUs and Duration
```bash
k6 run --vus 50 --duration 2m tests/load/api-load-test.js
```

### Set Custom API URL
```bash
k6 run --env API_URL=https://api.travelhub.com tests/load/api-load-test.js
```

### Export Results
```bash
# JSON format
k6 run --out json=results.json tests/load/api-load-test.js

# InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 tests/load/api-load-test.js

# CSV
k6 run --out csv=results.csv tests/load/api-load-test.js
```

## Test Types

### 1. Load Test (`api-load-test.js`)
- **Purpose**: Test normal operational capacity
- **Duration**: ~4.5 minutes
- **Max VUs**: 50 concurrent users
- **Scenarios**:
  - Health checks
  - User authentication
  - Flight/Hotel searches
  - Profile operations

### 2. Stress Test (`stress-test.js`)
- **Purpose**: Find breaking point
- **Duration**: ~12 minutes
- **Max VUs**: 300 concurrent users
- **Focus**: Read-heavy endpoints

### 3. Spike Test (`spike-test.js`)
- **Purpose**: Test recovery from traffic spikes
- **Duration**: ~2 minutes
- **Max VUs**: 500 concurrent users (spike)
- **Pattern**: Sudden spike from 10 to 500 users

## Metrics Explained

### HTTP Request Duration
- **p(95)**: 95th percentile response time
- **p(99)**: 99th percentile response time
- Target: p(95) < 500ms for normal operations

### Error Rate
- `http_req_failed`: Native k6 metric for failed requests
- `errors`: Custom metric tracking application-level errors
- Target: < 1% for load test, < 10% for stress test

### Custom Metrics
- `login_duration`: Time to complete authentication
- `search_duration`: Time to complete search operations
- `request_count`: Total number of requests made

## Thresholds

Thresholds define pass/fail criteria:

```javascript
thresholds: {
  http_req_duration: ['p(95)<500'],  // 95% under 500ms
  http_req_failed: ['rate<0.01'],    // <1% failures
  errors: ['rate<0.05'],             // <5% custom errors
}
```

## Interpreting Results

### Successful Test
```
✓ http_req_duration..............: avg=245ms   p(95)=450ms
✓ http_req_failed................: 0.25%
✓ errors.........................: 0.10%
```

### Failed Test
```
✗ http_req_duration..............: avg=1.2s    p(95)=2.5s
✗ http_req_failed................: 5.30%
✓ errors.........................: 0.50%
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Load Tests
  run: |
    k6 run --quiet --no-color tests/load/api-load-test.js
```

### Environment Variables
- `API_URL`: Base URL for API (default: http://localhost:5000)
- `K6_ITERATIONS`: Number of iterations per VU
- `K6_VUS`: Number of virtual users
- `K6_DURATION`: Test duration

## Best Practices

1. **Start Small**: Begin with 10 VUs and increase gradually
2. **Monitor Resources**: Watch CPU, memory, and network during tests
3. **Realistic Data**: Use production-like test data
4. **Database State**: Reset test database between runs
5. **Network Conditions**: Test under various network conditions
6. **Baseline First**: Establish baseline metrics before optimization

## Troubleshooting

### Connection Refused
- Ensure API server is running
- Check `API_URL` environment variable
- Verify firewall settings

### High Error Rate
- Check server logs for errors
- Monitor database connections
- Review rate limiting settings
- Check Redis availability

### Slow Response Times
- Profile application code
- Check database query performance
- Review caching strategy
- Monitor external API calls

## Next Steps

1. **Set up monitoring**: Integrate with Grafana/Prometheus
2. **Automate tests**: Add to CI/CD pipeline
3. **Create baselines**: Document performance baselines
4. **Regular testing**: Schedule weekly load tests
5. **Optimize**: Address performance bottlenecks

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Cloud](https://k6.io/cloud/)
- [Performance Testing Guide](https://k6.io/docs/test-types/introduction/)
