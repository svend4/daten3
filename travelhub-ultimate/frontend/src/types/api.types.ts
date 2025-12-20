export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface SearchParams {
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  rooms?: number;
}

export interface HotelSearchResult {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  price: number;
  currency: string;
  images: string[];
  amenities: string[];
}

export interface FlightSearchResult {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency: string;
  class: 'economy' | 'business' | 'first';
  stops: number;
}

export interface FlightFilters {
  priceRange?: [number, number];
  airlines?: string[];
  stops?: number[];
  departureTime?: string[];
  class?: string[];
}

export interface HotelFilters {
  priceRange?: [number, number];
  rating?: number;
  amenities?: string[];
  propertyTypes?: string[];
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  rating: number;
  price: number;
  currency: string;
  images: string[];
  amenities: string[];
  address: string;
  city: string;
  country: string;
}
