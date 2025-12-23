/**
 * k6 Load Test for TravelHub API
 *
 * Installation: https://k6.io/docs/getting-started/installation/
 *
 * Run tests:
 *   k6 run tests/load/api-load-test.js                    # Default test
 *   k6 run tests/load/api-load-test.js --vus 10 --duration 30s  # Custom config
 *   k6 run tests/load/api-load-test.js --out json=results.json  # Export results
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const searchDuration = new Trend('search_duration');
const requestCount = new Counter('request_count');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users over 30s
    { duration: '1m', target: 10 },   // Stay at 10 users for 1 minute
    { duration: '30s', target: 50 },  // Ramp up to 50 users over 30s
    { duration: '2m', target: 50 },   // Stay at 50 users for 2 minutes
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
    errors: ['rate<0.05'],             // Custom error rate must be less than 5%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

// Test data
const testUser = {
  email: `loadtest-${Date.now()}@example.com`,
  username: `loaduser${Date.now()}`,
  password: 'LoadTest123!',
  firstName: 'Load',
  lastName: 'Test',
};

let authToken = '';

export function setup() {
  // Register a test user for load testing
  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (registerRes.status === 201) {
    const body = JSON.parse(registerRes.body);
    return { token: body.token, userId: body.data.id };
  }

  return { token: '', userId: '' };
}

export default function (data) {
  requestCount.add(1);

  // Test 1: Health Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Login
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => {
      const body = JSON.parse(r.body);
      return body.token !== undefined;
    },
  });

  if (loginSuccess) {
    const body = JSON.parse(loginRes.body);
    authToken = body.token;
    loginDuration.add(Date.now() - loginStart);
  } else {
    errorRate.add(1);
  }

  sleep(1);

  // Test 3: Get User Profile (Authenticated Request)
  if (authToken) {
    const profileRes = http.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    check(profileRes, {
      'profile status is 200': (r) => r.status === 200,
      'profile response time < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 4: Search Flights
  const searchStart = Date.now();
  const flightSearchRes = http.get(
    `${BASE_URL}/api/flights/search?origin=JFK&destination=LAX&departureDate=2024-12-25&passengers=1`
  );

  check(flightSearchRes, {
    'flight search status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  }) || errorRate.add(1);

  if (flightSearchRes.status === 200) {
    searchDuration.add(Date.now() - searchStart);
  }

  sleep(1);

  // Test 5: Search Hotels
  const hotelSearchRes = http.get(
    `${BASE_URL}/api/hotels/search?city=New+York&checkIn=2024-12-25&checkOut=2024-12-28&guests=2`
  );

  check(hotelSearchRes, {
    'hotel search status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  }) || errorRate.add(1);

  sleep(2);
}

export function teardown(data) {
  console.log('Load test completed');
}
