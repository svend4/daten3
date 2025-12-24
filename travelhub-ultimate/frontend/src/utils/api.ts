import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;
  private csrfToken: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true, // ✅ Enables httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add CSRF token and log requests
    this.client.interceptors.request.use(
      async (config) => {
        // Add CSRF token for state-changing operations
        const method = config.method?.toLowerCase();
        if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
          // Ensure we have CSRF token
          if (!this.csrfToken && this.isInitialized) {
            await this.fetchCSRFToken();
          }

          // Add CSRF token to headers
          if (this.csrfToken) {
            config.headers['X-CSRF-Token'] = this.csrfToken;
          }
        }

        // Log API request in development
        logger.apiRequest(config.method || 'GET', config.url || '', config.data);

        return config;
      },
      (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and log responses
    this.client.interceptors.response.use(
      (response) => {
        // Log API response in development
        logger.apiResponse(
          response.config.method || 'GET',
          response.config.url || '',
          response.status,
          response.data
        );
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // Don't redirect on auth check endpoint - this is expected for logged out users
          const isAuthCheck = originalRequest.url?.includes('/auth/me');

          if (!isAuthCheck) {
            logger.warn('Unauthorized - redirecting to login');
            // Clear user data from localStorage
            localStorage.removeItem('user');
            // Cookies are cleared by server
            window.location.href = '/login';
          } else {
            logger.info('Auth check returned 401 - user not authenticated');
          }
        }
        // Handle 403 CSRF token issues
        else if (
          error.response?.status === 403 &&
          error.response?.data?.error?.includes('CSRF') &&
          !originalRequest._csrfRetry
        ) {
          logger.warn('CSRF token invalid, refreshing...');
          // Mark request to prevent infinite retry
          originalRequest._csrfRetry = true;

          // Fetch new CSRF token
          await this.fetchCSRFToken();

          // Retry original request with new token
          if (this.csrfToken) {
            originalRequest.headers['X-CSRF-Token'] = this.csrfToken;
            return this.client.request(originalRequest);
          }
        }
        else {
          logger.error(
            `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            error.response?.data || error.message
          );
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize API client - fetch CSRF token
   * Should be called on app startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.fetchCSRFToken();
      this.isInitialized = true;
      logger.info('API Client initialized with CSRF token');
    } catch (error) {
      logger.error('Failed to initialize API client', error);
      // Continue anyway - CSRF token will be fetched on first request
      this.isInitialized = true;
    }
  }

  /**
   * Fetch CSRF token from server
   * @private
   */
  private async fetchCSRFToken(): Promise<void> {
    try {
      const response = await this.client.get('/auth/csrf-token');
      this.csrfToken = response.data.data.csrfToken;
      logger.info('CSRF token fetched successfully');
    } catch (error) {
      logger.error('Failed to fetch CSRF token', error);
      throw error;
    }
  }

  /**
   * Refresh CSRF token - call after login/logout
   */
  async refreshCSRFToken(): Promise<void> {
    await this.fetchCSRFToken();
  }

  /**
   * Clear CSRF token - call on logout
   */
  clearCSRFToken(): void {
    this.csrfToken = '';
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
