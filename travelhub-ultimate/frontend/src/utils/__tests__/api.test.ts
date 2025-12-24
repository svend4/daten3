import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock axios before importing api - factory must be self-contained
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Import api after mocking
import { api } from '../api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP Methods', () => {
    it('should have get method', () => {
      expect(typeof api.get).toBe('function');
    });

    it('should have post method', () => {
      expect(typeof api.post).toBe('function');
    });

    it('should have put method', () => {
      expect(typeof api.put).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof api.delete).toBe('function');
    });
  });

  describe('Initialization', () => {
    it('should have initialize method', () => {
      expect(typeof api.initialize).toBe('function');
    });

    it('should have refreshCSRFToken method', () => {
      expect(typeof api.refreshCSRFToken).toBe('function');
    });

    it('should have clearCSRFToken method', () => {
      expect(typeof api.clearCSRFToken).toBe('function');
    });
  });

  describe('API Configuration', () => {
    it('should export api object', () => {
      expect(api).toBeDefined();
    });

    it('should be properly initialized', () => {
      // API should have all required methods
      expect(api.get).toBeDefined();
      expect(api.post).toBeDefined();
      expect(api.put).toBeDefined();
      expect(api.delete).toBeDefined();
      expect(api.initialize).toBeDefined();
      expect(api.refreshCSRFToken).toBeDefined();
      expect(api.clearCSRFToken).toBeDefined();
    });
  });
});
