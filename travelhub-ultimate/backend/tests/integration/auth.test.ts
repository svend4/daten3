/**
 * Integration Tests for Authentication Endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import supertest from 'supertest';
import { randomEmail, randomUsername } from '@tests/utils/testHelpers';

// Mock dependencies before importing app
vi.mock('@/services/redis.service', () => ({
  redisService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    getClient: vi.fn(() => ({
      isOpen: true,
      isReady: true,
    })),
  },
}));

vi.mock('@/services/cache.service', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  CACHE_TTL: {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 86400,
  },
}));

vi.mock('@/queues/messageQueue', () => ({
  messageQueue: {
    addJob: vi.fn().mockResolvedValue({ id: 'job-123' }),
    getQueues: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('@/services/email.service', () => ({
  emailService: {
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  },
}));

// Import app after mocks
let app: any;
let request: supertest.SuperTest<supertest.Test>;

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    // Dynamically import app after mocks are set up
    const appModule = await import('@/index');
    app = appModule.default;
    request = supertest(app);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: randomEmail(),
        username: randomUsername(),
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('email', userData.email);
      expect(response.body.data).toHaveProperty('username', userData.username);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        username: randomUsername(),
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: randomEmail(),
        username: randomUsername(),
        password: '123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with duplicate email', async () => {
      const email = randomEmail();
      const userData = {
        email,
        username: randomUsername(),
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register first user
      await request.post('/api/auth/register').send(userData).expect(201);

      // Try to register with same email
      const duplicateData = {
        ...userData,
        username: randomUsername(), // Different username
      };

      const response = await request
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({
          email: randomEmail(),
          // Missing username, password, etc.
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      email: randomEmail(),
      username: randomUsername(),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      // Create a test user
      await request.post('/api/auth/register').send(testUser);
    });

    it('should login successfully with email', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('email', testUser.email);
    });

    it('should login successfully with username', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject login with wrong password', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent user', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with missing credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;
    const testUser = {
      email: randomEmail(),
      username: randomUsername(),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request
        .post('/api/auth/register')
        .send(testUser);

      authToken = registerResponse.body.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('username', testUser.username);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/me', () => {
    let authToken: string;
    const testUser = {
      email: randomEmail(),
      username: randomUsername(),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      const registerResponse = await request
        .post('/api/auth/register')
        .send(testUser);

      authToken = registerResponse.body.token;
    });

    it('should update user profile successfully', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('firstName', updates.firstName);
      expect(response.body.data).toHaveProperty('lastName', updates.lastName);
    });

    it('should reject update without token', async () => {
      const response = await request
        .put('/api/auth/me')
        .send({ firstName: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/csrf-token', () => {
    it('should get CSRF token', async () => {
      const response = await request
        .get('/api/auth/csrf-token')
        .expect(200);

      expect(response.body).toHaveProperty('csrfToken');
    });
  });
});
