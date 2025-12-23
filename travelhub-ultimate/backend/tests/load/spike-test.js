/**
 * k6 Spike Test for TravelHub API
 * Tests system behavior under sudden traffic spikes
 *
 * Run: k6 run tests/load/spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Warm up
    { duration: '10s', target: 10 },   // Stable
    { duration: '10s', target: 500 },  // SPIKE! Sudden jump to 500 users
    { duration: '1m', target: 500 },   // Stay at spike level
    { duration: '10s', target: 10 },   // Drop back to normal
    { duration: '10s', target: 10 },   // Recover
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // More lenient threshold for spike
    http_req_failed: ['rate<0.2'],      // Allow 20% error rate during spike
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

export default function () {
  const res = http.get(`${BASE_URL}/health`);

  check(res, {
    'status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}
