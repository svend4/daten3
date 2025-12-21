// src/services/api/travelhub.service.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Типы
export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}

export interface Flight {
  id: string;
  route: {
    origin: string;
    destination: string;
    originAirport?: string;
    destinationAirport?: string;
  };
  dates: {
    departure: string;
    return?: string;
  };
  price: {
    amount: number;
    currency: string;
  };
  airline: {
    code: string;
    name: string;
  };
  flightNumber: string;
  transfers: number;
  duration: string;
  link: string;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  rooms?: number;
}

export interface Hotel {
  id: string;
  name: string;
  stars: number;
  rating: number;
  address: string;
  location: {
    city: string;
    lat: number;
    lng: number;
  };
  price: {
    amount: number;
    currency: string;
    total: number;
  };
  image: string;
  amenities: string[];
  url: string;
}

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  cached?: boolean;
  error?: string;
}

class TravelHubService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Добавить auth token если есть
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
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
        if (error.response?.status === 429) {
          // Rate limit exceeded
          console.error('Rate limit exceeded. Please try again later.');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Поиск авиабилетов
   */
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    try {
      const response = await this.api.get<ApiResponse<Flight[]>>('/flights/search', {
        params
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Flight search failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Поиск отелей
   */
  async searchHotels(params: HotelSearchParams): Promise<Hotel[]> {
    try {
      const response = await this.api.get<ApiResponse<Hotel[]>>('/hotels/search', {
        params
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Hotel search failed:', error);
      throw this.handleError(error);
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
   * Обработка ошибок
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      return new Error(message);
    }
    return error;
  }
}

export default new TravelHubService();
