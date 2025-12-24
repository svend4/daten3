// Generic API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Search parameters
export interface SearchParams {
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  rooms?: number;
}

export interface FlightSearchParams extends SearchParams {
  class?: 'economy' | 'business' | 'first';
  directOnly?: boolean;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
}

// Hotel types
export interface Hotel {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviewCount?: number;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  amenities: string[];
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  url?: string;
}

export interface HotelSearchResult extends Hotel {
  distanceFromCenter?: string;
  freeCancellation?: boolean;
  breakfastIncluded?: boolean;
}

// Flight types
export interface Flight {
  id: string;
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency: string;
  class: 'economy' | 'business' | 'first';
  stops: number;
  stopLocations?: string[];
  baggage?: string;
}

export interface FlightSearchResult extends Flight {
  returnFlight?: Flight;
  totalPrice?: number;
}

// Booking types
export interface Booking {
  id: string;
  type: 'hotel' | 'flight' | 'car';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt?: string;
  totalPrice: number;
  currency: string;

  // Hotel booking specific
  hotel?: Hotel;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;

  // Flight booking specific
  flight?: Flight;
  passengers?: number;

  // Payment info
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;

  // User info
  userId: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Favorite item type
export interface FavoriteItem {
  id: string;
  type: 'hotel' | 'flight';
  addedAt: string;

  // Hotel data
  hotel?: Hotel;

  // Flight data
  flight?: Flight;

  // Common display properties
  name: string;
  image?: string;
  price: number;
  currency: string;
  location?: string;
}

// Filters
export interface FlightFilters {
  priceRange?: [number, number];
  airlines?: string[];
  stops?: number[];
  departureTime?: string[];
  class?: ('economy' | 'business' | 'first')[];
}

export interface HotelFilters {
  priceRange?: [number, number];
  rating?: number;
  amenities?: string[];
  propertyTypes?: string[];
  freeCancellation?: boolean;
  breakfastIncluded?: boolean;
}

// API Error type
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'affiliate';
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
