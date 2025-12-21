import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  Flight,
  Hotel,
  FlightSearchParams,
  HotelSearchParams,
  ApiResponse,
} from '../../types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class TravelHubService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add timestamp for cache busting
        config.params = {
          ...config.params,
          _t: Date.now(),
        };

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError) {
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again in a moment.');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }
  }

  /**
   * Search flights
   */
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    try {
      const response = await this.api.get<ApiResponse<Flight[]>>('/flights/search', {
        params,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Search failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('Flight search failed:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Search hotels
   */
  async searchHotels(params: HotelSearchParams): Promise<Hotel[]> {
    try {
      const response = await this.api.get<ApiResponse<Hotel[]>>('/hotels/search', {
        params,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Search failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('Hotel search failed:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.data.status === 'OK';
    } catch (error) {
      return false;
    }
  }

  /**
   * Transform error to user-friendly message
   */
  private transformError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     error.message;
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

export default new TravelHubService();
