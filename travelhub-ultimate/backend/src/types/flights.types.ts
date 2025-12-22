/**
 * Advanced Flight Types
 * Types for multi-city flights, price prediction, baggage, etc.
 */

// Flight Leg (single segment)
export interface FlightLeg {
  origin: string; // IATA code
  destination: string; // IATA code
  departDate: string; // YYYY-MM-DD
  departTime?: string; // HH:MM
  arriveDate?: string;
  arriveTime?: string;
  flightNumber?: string;
  airline?: string;
  aircraft?: string;
  duration?: number; // minutes
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}

// Multi-city Flight Request
export interface MultiCityFlightRequest {
  legs: FlightLeg[]; // 2-6 legs
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  currency?: string;
}

// Flight Comparison
export interface FlightComparison {
  flights: string[]; // flight IDs to compare
  compareBy: ('price' | 'duration' | 'stops' | 'departure' | 'arrival' | 'airline')[];
}

// Price Prediction
export interface PricePrediction {
  route: {
    origin: string;
    destination: string;
  };
  date: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number; // 0-1
  recommendation: 'buy_now' | 'wait' | 'good_deal';
  priceHistory: PriceHistoryPoint[];
  factors: PriceFactor[];
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface PriceFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

// Baggage Information
export interface BaggageInfo {
  carryOn: {
    included: boolean;
    weight?: number; // kg
    dimensions?: {
      length: number; // cm
      width: number;
      height: number;
    };
    pieces?: number;
    price?: number; // if not included
  };
  checked: {
    included: boolean;
    weight?: number; // kg
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    pieces?: number;
    price?: number; // per bag
    additionalPrice?: number; // 2nd, 3rd bag
  };
  specialItems?: {
    type: 'sports' | 'music' | 'pet' | 'oversized';
    allowed: boolean;
    price?: number;
    restrictions?: string;
  }[];
}

// Baggage Calculator Request
export interface BaggageCalculatorRequest {
  flightId: string;
  airline: string;
  cabinClass: string;
  route: {
    origin: string;
    destination: string;
  };
  bags: {
    carryOn: number;
    checked: number;
    specialItems?: string[];
  };
}

// Baggage Calculator Response
export interface BaggageCalculatorResponse {
  totalCost: number;
  currency: string;
  breakdown: {
    carryOn: number;
    checked: number;
    special: number;
  };
  allowance: BaggageInfo;
  recommendations?: string[];
}

// Seat Selection
export interface SeatMap {
  aircraft: string;
  layout: string; // e.g., "3-3-3" for Boeing 777
  rows: SeatRow[];
  legend: SeatLegend;
}

export interface SeatRow {
  number: number;
  seats: Seat[];
}

export interface Seat {
  column: string; // A, B, C, etc.
  available: boolean;
  type: 'window' | 'middle' | 'aisle';
  class: 'economy' | 'premium_economy' | 'business' | 'first';
  features?: ('extra_legroom' | 'exit_row' | 'bulkhead' | 'preferred')[];
  price?: number; // additional cost
  blocked?: boolean;
  passengerName?: string;
}

export interface SeatLegend {
  available: string;
  occupied: string;
  blocked: string;
  extraLegroom: string;
  exitRow: string;
  preferred: string;
}

// Seat Selection Request
export interface SeatSelectionRequest {
  flightId: string;
  bookingId: string;
  passengers: {
    passengerId: string;
    seat: {
      row: number;
      column: string;
    };
  }[];
}

// Flexible Dates Search
export interface FlexibleDatesRequest {
  origin: string;
  destination: string;
  baseDate: string; // YYYY-MM-DD
  flexDays: number; // ±N days
  returnBaseDate?: string;
  returnFlexDays?: number;
  adults?: number;
  children?: number;
  cabinClass?: string;
}

export interface FlexibleDatesResponse {
  calendar: DatePrice[];
  cheapestDate: string;
  cheapestPrice: number;
  recommendations: string[];
}

export interface DatePrice {
  date: string;
  price: number;
  available: boolean;
  priceChange?: number; // % change from cheapest
}

// Flight Alerts
export interface FlightPriceAlert {
  id: string;
  userId: string;
  route: {
    origin: string;
    destination: string;
  };
  dates: {
    departure: string;
    return?: string;
    flexible?: boolean;
  };
  maxPrice: number;
  currency: string;
  active: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  currentPrice?: number;
}

// Airline Alliance
export enum AirlineAlliance {
  STAR_ALLIANCE = 'star_alliance',
  ONEWORLD = 'oneworld',
  SKYTEAM = 'skyteam',
  NONE = 'none'
}

// Flight Status
export interface FlightStatus {
  flightNumber: string;
  airline: string;
  date: string;
  status: 'scheduled' | 'delayed' | 'departed' | 'arrived' | 'cancelled';
  departure: {
    airport: string;
    terminal?: string;
    gate?: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
  };
  arrival: {
    airport: string;
    terminal?: string;
    gate?: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
  };
  delay?: number; // minutes
  aircraft?: string;
  codeshares?: string[];
}

// Fare Rules
export interface FareRules {
  cancellation: {
    allowed: boolean;
    fee?: number;
    refundable?: boolean;
    deadline?: string; // hours before departure
  };
  changes: {
    allowed: boolean;
    fee?: number;
    sameAirlineOnly?: boolean;
    deadline?: string;
  };
  baggage: BaggageInfo;
  seatSelection: {
    included: boolean;
    fee?: number;
  };
  mealService: {
    included: boolean;
    type?: string;
  };
  restrictions?: string[];
}

// Flight Search Result with Extended Info
export interface ExtendedFlightResult {
  id: string;
  outbound: FlightLeg[];
  inbound?: FlightLeg[];
  price: {
    total: number;
    currency: string;
    breakdown?: {
      base: number;
      taxes: number;
      fees: number;
    };
  };
  airline: {
    code: string;
    name: string;
    logo?: string;
    alliance?: AirlineAlliance;
  };
  duration: {
    outbound: number; // minutes
    inbound?: number;
    total: number;
  };
  stops: {
    outbound: number;
    inbound?: number;
  };
  cabinClass: string;
  baggage: BaggageInfo;
  fareRules: FareRules;
  amenities?: string[];
  carbonEmissions?: {
    kg: number;
    comparison: string; // "20% below average"
  };
  bookingUrl?: string;
  deepLink?: string;
}
