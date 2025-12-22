/**
 * Common Test Helpers and Utilities
 */

import { vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

/**
 * Create a mock Express Request object
 */
export const mockRequest = (overrides: Partial<Request> = {}): Request => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    method: 'GET',
    path: '/',
    url: '/',
    ip: '127.0.0.1',
    user: undefined,
    ...overrides,
  } as Request;
};

/**
 * Create a mock Express Response object
 */
export const mockResponse = (): Response => {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  return res as Response;
};

/**
 * Create a mock Next function
 */
export const mockNext = (): NextFunction => {
  return vi.fn();
};

/**
 * Generate a random email
 */
export const randomEmail = (): string => {
  return `test${Math.random().toString(36).substring(7)}@example.com`;
};

/**
 * Generate a random username
 */
export const randomUsername = (): string => {
  return `user${Math.random().toString(36).substring(7)}`;
};

/**
 * Generate a random string
 */
export const randomString = (length: number = 10): string => {
  return Math.random().toString(36).substring(2, 2 + length);
};

/**
 * Wait for a specified time (for async operations)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate a future date
 */
export const futureDate = (daysFromNow: number = 1): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

/**
 * Generate a past date
 */
export const pastDate = (daysAgo: number = 1): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

/**
 * Mock authenticated user request
 */
export const mockAuthRequest = (userId: string, role: string = 'user', overrides: Partial<Request> = {}): Request => {
  return mockRequest({
    user: {
      id: userId,
      role,
    },
    ...overrides,
  });
};

/**
 * Mock admin request
 */
export const mockAdminRequest = (userId: string = 'admin-123', overrides: Partial<Request> = {}): Request => {
  return mockAuthRequest(userId, 'admin', overrides);
};

/**
 * Create a mock Redis client
 */
export const mockRedisClient = () => {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) || null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    setEx: vi.fn(async (key: string, ttl: number, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    exists: vi.fn(async (key: string) => (store.has(key) ? 1 : 0)),
    expire: vi.fn(async () => 1),
    ttl: vi.fn(async () => 3600),
    keys: vi.fn(async (pattern: string) => Array.from(store.keys())),
    flushAll: vi.fn(async () => {
      store.clear();
      return 'OK';
    }),
    quit: vi.fn(async () => 'OK'),
    disconnect: vi.fn(async () => {}),
    connect: vi.fn(async () => {}),
    isOpen: true,
    isReady: true,
  };
};

/**
 * Create a mock Prisma client
 */
export const mockPrismaClient = () => {
  const createMockModel = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    upsert: vi.fn(),
    createMany: vi.fn(),
    updateMany: vi.fn(),
  });

  return {
    user: createMockModel(),
    flight: createMockModel(),
    hotel: createMockModel(),
    booking: createMockModel(),
    review: createMockModel(),
    affiliate: createMockModel(),
    loyaltyProgram: createMockModel(),
    priceAlert: createMockModel(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn((callback) => callback(this)),
  };
};

/**
 * Expect error to be thrown
 */
export const expectError = async (fn: () => Promise<any>, errorMessage?: string): Promise<Error> => {
  try {
    await fn();
    throw new Error('Expected function to throw an error, but it did not');
  } catch (error: any) {
    if (errorMessage && !error.message.includes(errorMessage)) {
      throw new Error(`Expected error message to include "${errorMessage}", but got "${error.message}"`);
    }
    return error;
  }
};
