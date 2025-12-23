import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { api } from '../api';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('API Client', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock axios.create to return a mock instance
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

    mockedAxios.create = vi.fn(() => mockAxiosInstance as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create axios instance with correct config', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.any(String),
        withCredentials: true,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should have request and response interceptors', () => {
    const mockInstance = mockedAxios.create.mock.results[0].value;
    expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
    expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
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
});
