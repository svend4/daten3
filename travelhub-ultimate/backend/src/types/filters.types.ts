/**
 * Advanced Search Filters Types
 * Comprehensive filtering system for hotels and flights
 */

// Hotel Amenities
export enum HotelAmenity {
  WIFI = 'wifi',
  POOL = 'pool',
  PARKING = 'parking',
  GYM = 'gym',
  RESTAURANT = 'restaurant',
  BAR = 'bar',
  SPA = 'spa',
  ROOM_SERVICE = 'room_service',
  AIR_CONDITIONING = 'air_conditioning',
  BREAKFAST = 'breakfast',
  PET_FRIENDLY = 'pet_friendly',
  BUSINESS_CENTER = 'business_center',
  CONFERENCE_ROOMS = 'conference_rooms',
  LAUNDRY = 'laundry',
  AIRPORT_SHUTTLE = 'airport_shuttle',
  BEACH_ACCESS = 'beach_access',
  KIDS_CLUB = 'kids_club',
  CONCIERGE = 'concierge'
}

// Hotel Property Types
export enum HotelPropertyType {
  HOTEL = 'hotel',
  RESORT = 'resort',
  APARTMENT = 'apartment',
  HOSTEL = 'hostel',
  GUESTHOUSE = 'guesthouse',
  VILLA = 'villa',
  BED_AND_BREAKFAST = 'bed_and_breakfast',
  BOUTIQUE = 'boutique'
}

// Price Range
export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

// Star Rating
export type StarRating = 1 | 2 | 3 | 4 | 5;

// Distance Range (km from city center)
export interface DistanceRange {
  min: number; // km
  max: number; // km
}

// Guest Rating Range (0-10)
export interface GuestRatingRange {
  min: number; // 0-10
  max: number; // 0-10
}

// Hotel Search Filters
export interface HotelSearchFilters {
  // Basic filters
  priceRange?: PriceRange;
  starRating?: StarRating[];
  guestRating?: GuestRatingRange;
  distanceFromCenter?: DistanceRange;

  // Property type
  propertyTypes?: HotelPropertyType[];

  // Amenities
  amenities?: HotelAmenity[];
  amenitiesMatchAll?: boolean; // true = AND, false = OR

  // Room features
  bedType?: ('single' | 'double' | 'king' | 'queen' | 'twin')[];
  roomSize?: {
    min?: number; // sqm
    max?: number;
  };

  // Policies
  freeCancellation?: boolean;
  payAtHotel?: boolean;
  instantConfirmation?: boolean;

  // Meal plans
  mealPlans?: ('room_only' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive')[];

  // Special offers
  dealsOnly?: boolean;
  lastMinuteDeals?: boolean;

  // Accessibility
  wheelchairAccessible?: boolean;

  // Sorting
  sortBy?: 'price' | 'rating' | 'distance' | 'popularity' | 'stars';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
}

// Flight Search Filters
export interface FlightSearchFilters {
  // Price
  priceRange?: PriceRange;

  // Airlines
  airlines?: string[]; // airline codes
  excludeAirlines?: string[];

  // Stops
  maxStops?: 0 | 1 | 2 | 3;
  directFlightsOnly?: boolean;

  // Time filters
  departureTime?: {
    from?: string; // HH:mm
    to?: string;
  };
  arrivalTime?: {
    from?: string;
    to?: string;
  };

  // Duration
  maxDuration?: number; // minutes

  // Cabin class
  cabinClass?: ('economy' | 'premium_economy' | 'business' | 'first')[];

  // Aircraft
  aircraftTypes?: string[];

  // Baggage
  checkedBagIncluded?: boolean;
  carryOnOnly?: boolean;

  // Booking options
  refundable?: boolean;
  changeable?: boolean;

  // Alliances
  alliances?: ('star_alliance' | 'oneworld' | 'skyteam')[];

  // Sorting
  sortBy?: 'price' | 'duration' | 'departure' | 'arrival' | 'airline';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
}

// Car Rental Filters
export interface CarRentalFilters {
  // Price
  priceRange?: PriceRange;

  // Car type
  carTypes?: ('economy' | 'compact' | 'midsize' | 'fullsize' | 'suv' | 'luxury' | 'van')[];

  // Transmission
  transmission?: ('manual' | 'automatic')[];

  // Fuel type
  fuelType?: ('petrol' | 'diesel' | 'electric' | 'hybrid')[];

  // Features
  airConditioning?: boolean;
  unlimitedMileage?: boolean;
  gps?: boolean;

  // Seats
  minSeats?: number;
  maxSeats?: number;

  // Supplier
  suppliers?: string[];

  // Sorting
  sortBy?: 'price' | 'rating' | 'supplier';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
}

// Flexible Dates Search
export interface FlexibleDatesSearch {
  baseDate: string; // YYYY-MM-DD
  flexDays: number; // ±N days
  duration?: number; // number of nights/days
}

// Multi-destination Search
export interface MultiDestinationLeg {
  origin: string;
  destination: string;
  date: string;
}

export interface MultiDestinationSearch {
  legs: MultiDestinationLeg[];
  adults?: number;
  children?: number;
  cabinClass?: string;
}

// Filter validation result
export interface FilterValidationResult {
  isValid: boolean;
  errors?: string[];
  sanitizedFilters?: any;
}
