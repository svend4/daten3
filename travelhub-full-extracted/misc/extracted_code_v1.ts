// ============================================
// ОБЩИЕ ТИПЫ
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  cached?: boolean;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

// ============================================
// LOCATION TYPES
// ============================================

export interface Location {
  code: string;
  name: string;
  country?: string;
  countryCode?: string;
  city?: string;
  type?: 'airport' | 'city' | 'country';
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// ============================================
// FLIGHT TYPES
// ============================================

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: CabinClass;
}

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

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
    logo?: string;
  };
  flightNumber: string;
  transfers: number;
  duration: string;
  link: string;
  segments?: FlightSegment[];
}

export interface FlightSegment {
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  airline: string;
  flightNumber: string;
  aircraft?: string;
}

// ============================================
// HOTEL TYPES
// ============================================

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  rooms?: number;
  currency?: string;
  stars?: number[];
  minPrice?: number;
  maxPrice?: number;
}

export interface Hotel {
  id: string;
  name: string;
  stars: number;
  rating: number;
  reviewCount?: number;
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
  images?: string[];
  amenities: string[];
  url: string;
  description?: string;
  roomTypes?: RoomType[];
}

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  price: number;
  available: boolean;
  amenities: string[];
}

// ============================================
// CAR RENTAL TYPES
// ============================================

export interface CarSearchParams {
  location: string;
  pickupDate: string;
  dropoffDate: string;
  pickupTime?: string;
  dropoffTime?: string;
  driverAge?: number;
}

export interface Car {
  id: string;
  name: string;
  category: string;
  image: string;
  price: {
    amount: number;
    currency: string;
    perDay: number;
  };
  specs: {
    passengers: number;
    doors: number;
    transmission: 'automatic' | 'manual';
    fuelType: string;
    ac: boolean;
  };
  supplier: {
    name: string;
    logo?: string;
  };
  url: string;
}

// ============================================
// FILTER TYPES
// ============================================

export interface FlightFilters {
  maxPrice?: number;
  airlines?: string[];
  maxStops?: number;
  departureTimeRange?: TimeRange;
  arrivalTimeRange?: TimeRange;
}

export interface HotelFilters {
  priceRange?: [number, number];
  stars?: number[];
  amenities?: string[];
  rating?: number;
  sortBy?: 'price' | 'rating' | 'distance';
}

export interface TimeRange {
  start: number; // hours (0-23)
  end: number;   // hours (0-23)
}

// ============================================
// SEARCH STATE
// ============================================

export interface SearchState {
  isSearching: boolean;
  hasSearched: boolean;
  error: string | null;
  results: any[];
  filters: any;
}
