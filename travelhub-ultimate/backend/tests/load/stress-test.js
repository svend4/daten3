/**
 * k6 Stress Test for TravelHub API
 * Tests system behavior under extreme load
 *
 * Run: k6 run tests/load/stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 200 },  // Ramp up to 200 users
    { duration: '3m', target: 200 },  // Stay at 200 users
    { duration: '1m', target: 300 },  // Ramp up to 300 users
    { duration: '3m', target: 300 },  // Stay at 300 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% of requests under 1s
    http_req_failed: ['rate<0.1'],     // Error rate < 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

export default function () {
  // Focus on read-heavy endpoints
  const endpoints = [
    `${BASE_URL}/health`,
    `${BASE_URL}/api/flights/search?origin=JFK&destination=LAX&departureDate=2024-12-25&passengers=1`,
    `${BASE_URL}/api/hotels/search?city=New+York&checkIn=2024-12-25&checkOut=2024-12-28&guests=2`,
  ];

  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(randomEndpoint);

  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(0.5); // Shorter sleep for stress test
}
