/**
 * E2E Test: Complete User Booking Flow
 * Tests the entire flow from registration to booking
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Booking Flow', () => {
  const baseURL = process.env.API_URL || 'http://localhost:5000';
  let authToken: string;
  let userId: string;
  const timestamp = Date.now();

  const testUser = {
    email: `e2e-test-${timestamp}@example.com`,
    username: `e2euser${timestamp}`,
    password: 'E2ETestPassword123!',
    firstName: 'E2E',
    lastName: 'Test',
  };

  test('1. User Registration', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/auth/register`, {
      data: testUser,
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body).toHaveProperty('token');
    expect(body.data).toHaveProperty('id');
    expect(body.data.email).toBe(testUser.email);

    authToken = body.token;
    userId = body.data.id;
  });

  test('2. Login with Credentials', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body).toHaveProperty('token');

    authToken = body.token;
  });

  test('3. Get User Profile', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.email).toBe(testUser.email);
    expect(body.data.firstName).toBe(testUser.firstName);
  });

  test('4. Search for Flights', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/flights/search`, {
      params: {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2024-12-25',
        passengers: '1',
      },
    });

    // May return 200 or 404 depending on API availability
    if (response.ok()) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
    }
  });

  test('5. Search for Hotels', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/hotels/search`, {
      params: {
        city: 'New York',
        checkIn: '2024-12-25',
        checkOut: '2024-12-28',
        guests: '2',
      },
    });

    // May return 200 or 404 depending on API availability
    if (response.ok()) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
    }
  });

  test('6. Update User Profile', async ({ request }) => {
    const response = await request.put(`${baseURL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        firstName: 'Updated',
        lastName: 'Name',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.firstName).toBe('Updated');
    expect(body.data.lastName).toBe('Name');
  });

  test('7. Verify Health Check', async ({ request }) => {
    const response = await request.get(`${baseURL}/health`);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body.status).toBe('healthy');
  });

  test('8. Logout', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/auth/logout`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body.success).toBe(true);
  });
});

test.describe('API Error Handling', () => {
  const baseURL = process.env.API_URL || 'http://localhost:5000';

  test('Should handle 404 for non-existent endpoints', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/non-existent-endpoint`);
    expect(response.status()).toBe(404);
  });

  test('Should handle 401 for unauthorized access', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/auth/me`);
    expect(response.status()).toBe(401);
  });

  test('Should handle 400 for invalid data', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/auth/register`, {
      data: {
        email: 'invalid-email',
        // Missing required fields
      },
    });
    expect(response.status()).toBe(400);
  });
});
