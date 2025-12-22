import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/travelhub_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock Redis client
vi.mock('../services/redis.service', () => ({
  redisService: {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    ping: vi.fn().mockResolvedValue('PONG'),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    getObject: vi.fn().mockResolvedValue(null),
    setObject: vi.fn().mockResolvedValue(undefined),
    cacheHotelSearch: vi.fn().mockResolvedValue(undefined),
    getCachedHotelSearch: vi.fn().mockResolvedValue(null),
    cacheFlightSearch: vi.fn().mockResolvedValue(undefined),
    getCachedFlightSearch: vi.fn().mockResolvedValue(null),
  },
}));

// Mock Prisma client
vi.mock('../lib/prisma', () => ({
  prisma: {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    affiliate: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    commission: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  default: {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock external API calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
    })),
  },
}));

// Setup and teardown
beforeAll(async () => {
  // Setup test database if needed
  console.log('🧪 Test environment setup complete');
});

afterAll(async () => {
  // Cleanup
  console.log('🧹 Test environment cleanup complete');
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});
