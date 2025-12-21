import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and log requests
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
      (error) => {
        if (error.response?.status === 401) {
          logger.warn('Unauthorized - redirecting to login');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          logger.error(
            `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            error.response?.data || error.message
          );
        }
        return Promise.reject(error);
      }
    );
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
