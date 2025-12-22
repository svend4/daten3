/**
 * Filter Helper Utilities
 * Functions for filtering and sorting hotel/flight results
 */

import { HotelSearchFilters } from '../types/filters.types.js';

/**
 * Apply filters to hotel results
 */
export function applyHotelFilters(hotels: any[], filters: any): any[] {
  let filtered = [...hotels];

  // Price range filter
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    filtered = filtered.filter((hotel) => {
      const price = hotel.price?.amount || hotel.priceFrom || hotel.price || 0;
      const min = filters.priceMin || 0;
      const max = filters.priceMax || Infinity;
      return price >= min && price <= max;
    });
  }

  // Star rating filter
  if (filters.starRating) {
    const ratings = Array.isArray(filters.starRating)
      ? filters.starRating.map((r: string) => parseInt(r))
      : [parseInt(filters.starRating)];

    filtered = filtered.filter((hotel) =>
      ratings.includes(hotel.stars || 0)
    );
  }

  // Guest rating filter
  if (filters.guestRatingMin !== undefined || filters.guestRatingMax !== undefined) {
    filtered = filtered.filter((hotel) => {
      const rating = hotel.rating || hotel.guestRating || 0;
      const min = filters.guestRatingMin || 0;
      const max = filters.guestRatingMax || 10;
      return rating >= min && rating <= max;
    });
  }

  // Distance from center filter
  if (filters.distanceMax !== undefined) {
    filtered = filtered.filter((hotel) => {
      const distance = hotel.location?.distance || hotel.distanceToCityCentre || 0;
      return distance <= filters.distanceMax;
    });
  }

  // Amenities filter
  if (filters.amenities) {
    const requiredAmenities = typeof filters.amenities === 'string'
      ? filters.amenities.split(',').map((a: string) => a.trim().toLowerCase())
      : filters.amenities.map((a: string) => a.toLowerCase());

    filtered = filtered.filter((hotel) => {
      const hotelAmenities = (hotel.amenities || []).map((a: string) =>
        a.toLowerCase().replace(/\s+/g, '_')
      );

      // Check if hotel has all required amenities (AND logic)
      return requiredAmenities.every((req: string) =>
        hotelAmenities.some((ha: string) =>
          ha.includes(req) || req.includes(ha)
        )
      );
    });
  }

  // Property types filter
  if (filters.propertyTypes) {
    const types = typeof filters.propertyTypes === 'string'
      ? filters.propertyTypes.split(',').map((t: string) => t.trim().toLowerCase())
      : filters.propertyTypes.map((t: string) => t.toLowerCase());

    filtered = filtered.filter((hotel) => {
      const hotelType = (hotel.propertyType || hotel.type || 'hotel').toLowerCase();
      return types.includes(hotelType);
    });
  }

  // Free cancellation filter
  if (filters.freeCancellation === true) {
    filtered = filtered.filter((hotel) =>
      hotel.freeCancellation === true || hotel.policies?.cancellation === 'free'
    );
  }

  // Pay at hotel filter
  if (filters.payAtHotel === true) {
    filtered = filtered.filter((hotel) =>
      hotel.payAtHotel === true || hotel.paymentOptions?.includes('pay_at_hotel')
    );
  }

  // Deals only filter
  if (filters.dealsOnly === true) {
    filtered = filtered.filter((hotel) =>
      hotel.deal === true || hotel.discount || hotel.specialOffer
    );
  }

  // Wheelchair accessible filter
  if (filters.wheelchairAccessible === true) {
    filtered = filtered.filter((hotel) =>
      hotel.wheelchairAccessible === true ||
      hotel.accessibility?.wheelchair === true ||
      (hotel.amenities || []).some((a: string) =>
        a.toLowerCase().includes('wheelchair') || a.toLowerCase().includes('accessible')
      )
    );
  }

  return filtered;
}

/**
 * Sort hotel results
 */
export function sortHotels(hotels: any[], sortBy: string = 'price', sortOrder: string = 'asc'): any[] {
  const sorted = [...hotels];

  sorted.sort((a, b) => {
    let compareA: any;
    let compareB: any;

    switch (sortBy) {
      case 'price':
        compareA = a.price?.amount || a.priceFrom || a.price || 0;
        compareB = b.price?.amount || b.priceFrom || b.price || 0;
        break;

      case 'rating':
        compareA = a.rating || a.guestRating || 0;
        compareB = b.rating || b.guestRating || 0;
        break;

      case 'distance':
        compareA = a.location?.distance || a.distanceToCityCentre || 0;
        compareB = b.location?.distance || b.distanceToCityCentre || 0;
        break;

      case 'stars':
        compareA = a.stars || 0;
        compareB = b.stars || 0;
        break;

      case 'popularity':
        compareA = a.popularity || a.bookingCount || 0;
        compareB = b.popularity || b.bookingCount || 0;
        break;

      default:
        compareA = a.price?.amount || 0;
        compareB = b.price?.amount || 0;
    }

    if (sortOrder === 'desc') {
      return compareB - compareA;
    }
    return compareA - compareB;
  });

  return sorted;
}

/**
 * Paginate results
 */
export function paginateResults<T>(items: T[], page: number = 1, limit: number = 20): {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: items.slice(start, end),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Apply filters to flight results
 */
export function applyFlightFilters(flights: any[], filters: any): any[] {
  let filtered = [...flights];

  // Price range filter
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    filtered = filtered.filter((flight) => {
      const price = flight.price?.amount || flight.price || 0;
      const min = filters.priceMin || 0;
      const max = filters.priceMax || Infinity;
      return price >= min && price <= max;
    });
  }

  // Direct flights only
  if (filters.directFlightsOnly === true || filters.maxStops === 0) {
    filtered = filtered.filter((flight) =>
      flight.transfers === 0 || flight.stops === 0
    );
  }

  // Max stops filter
  if (filters.maxStops !== undefined && filters.maxStops > 0) {
    filtered = filtered.filter((flight) =>
      (flight.transfers || flight.stops || 0) <= filters.maxStops
    );
  }

  // Airlines filter
  if (filters.airlines) {
    const airlines = typeof filters.airlines === 'string'
      ? filters.airlines.split(',').map((a: string) => a.trim().toUpperCase())
      : filters.airlines.map((a: string) => a.toUpperCase());

    filtered = filtered.filter((flight) =>
      airlines.includes((flight.airline?.code || flight.airline || '').toUpperCase())
    );
  }

  // Exclude airlines
  if (filters.excludeAirlines) {
    const excluded = typeof filters.excludeAirlines === 'string'
      ? filters.excludeAirlines.split(',').map((a: string) => a.trim().toUpperCase())
      : filters.excludeAirlines.map((a: string) => a.toUpperCase());

    filtered = filtered.filter((flight) =>
      !excluded.includes((flight.airline?.code || flight.airline || '').toUpperCase())
    );
  }

  // Max duration filter (minutes)
  if (filters.maxDuration !== undefined) {
    filtered = filtered.filter((flight) =>
      (flight.duration || 0) <= filters.maxDuration
    );
  }

  // Cabin class filter
  if (filters.cabinClass) {
    const classes = typeof filters.cabinClass === 'string'
      ? filters.cabinClass.split(',').map((c: string) => c.trim().toLowerCase())
      : filters.cabinClass.map((c: string) => c.toLowerCase());

    filtered = filtered.filter((flight) =>
      classes.includes((flight.class || flight.cabinClass || 'economy').toLowerCase())
    );
  }

  // Refundable filter
  if (filters.refundable === true) {
    filtered = filtered.filter((flight) =>
      flight.refundable === true || flight.policies?.refund === true
    );
  }

  // Checked bag included
  if (filters.checkedBagIncluded === true) {
    filtered = filtered.filter((flight) =>
      flight.baggage?.checked || flight.includedBaggage
    );
  }

  return filtered;
}

/**
 * Sort flight results
 */
export function sortFlights(flights: any[], sortBy: string = 'price', sortOrder: string = 'asc'): any[] {
  const sorted = [...flights];

  sorted.sort((a, b) => {
    let compareA: any;
    let compareB: any;

    switch (sortBy) {
      case 'price':
        compareA = a.price?.amount || a.price || 0;
        compareB = b.price?.amount || b.price || 0;
        break;

      case 'duration':
        compareA = a.duration || 0;
        compareB = b.duration || 0;
        break;

      case 'departure':
        compareA = new Date(a.departTime || a.departure).getTime();
        compareB = new Date(b.departTime || b.departure).getTime();
        break;

      case 'arrival':
        compareA = new Date(a.arriveTime || a.arrival).getTime();
        compareB = new Date(b.arriveTime || b.arrival).getTime();
        break;

      case 'airline':
        compareA = a.airline?.name || a.airline || '';
        compareB = b.airline?.name || b.airline || '';
        return sortOrder === 'desc'
          ? compareB.localeCompare(compareA)
          : compareA.localeCompare(compareB);

      default:
        compareA = a.price?.amount || 0;
        compareB = b.price?.amount || 0;
    }

    if (sortOrder === 'desc') {
      return compareB - compareA;
    }
    return compareA - compareB;
  });

  return sorted;
}

/**
 * Calculate price statistics for filtering
 */
export function calculatePriceStats(items: any[]): {
  min: number;
  max: number;
  avg: number;
  median: number;
} {
  if (items.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0 };
  }

  const prices = items
    .map((item) => item.price?.amount || item.priceFrom || item.price || 0)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0 };
  }

  const min = prices[0];
  const max = prices[prices.length - 1];
  const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const median = prices[Math.floor(prices.length / 2)];

  return { min, max, avg, median };
}

/**
 * Highlight matching amenities
 */
export function highlightMatchingFeatures(
  items: any[],
  requestedFeatures: string[]
): any[] {
  return items.map((item) => {
    const itemFeatures = (item.amenities || []).map((a: string) =>
      a.toLowerCase().replace(/\s+/g, '_')
    );

    const matchingFeatures = requestedFeatures.filter((req) =>
      itemFeatures.some((f: string) => f.includes(req) || req.includes(f))
    );

    return {
      ...item,
      matchingFeatures,
      matchScore: matchingFeatures.length / Math.max(requestedFeatures.length, 1),
    };
  });
}
