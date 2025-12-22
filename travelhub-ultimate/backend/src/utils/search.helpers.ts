/**
 * Search Helper Utilities
 * Common search functions and filters
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Parse and validate date range
 */
export function parseDateRange(
  checkIn?: string,
  checkOut?: string
): { checkIn: Date; checkOut: Date } | null {
  if (!checkIn || !checkOut) {
    return null;
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Validate dates
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    throw new Error('Invalid date format');
  }

  // Check-in should be before check-out
  if (checkInDate >= checkOutDate) {
    throw new Error('Check-in date must be before check-out date');
  }

  // Check-in should not be in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    throw new Error('Check-in date cannot be in the past');
  }

  return { checkIn: checkInDate, checkOut: checkOutDate };
}

/**
 * Calculate nights between dates
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Parse price range filter
 */
export function parsePriceRange(
  minPrice?: string | number,
  maxPrice?: string | number
): { min: number; max: number } | null {
  if (!minPrice && !maxPrice) {
    return null;
  }

  const min = minPrice ? parseFloat(minPrice.toString()) : 0;
  const max = maxPrice ? parseFloat(maxPrice.toString()) : Infinity;

  if (isNaN(min) || isNaN(max)) {
    throw new Error('Invalid price format');
  }

  if (min < 0 || max < 0) {
    throw new Error('Price cannot be negative');
  }

  if (min > max) {
    throw new Error('Minimum price cannot be greater than maximum price');
  }

  return { min, max };
}

/**
 * Parse pagination parameters
 */
export function parsePagination(
  page?: string | number,
  limit?: string | number
): { skip: number; take: number; page: number } {
  const pageNum = page ? parseInt(page.toString()) : 1;
  const limitNum = limit ? parseInt(limit.toString()) : 20;

  if (isNaN(pageNum) || isNaN(limitNum)) {
    throw new Error('Invalid pagination parameters');
  }

  if (pageNum < 1) {
    throw new Error('Page number must be at least 1');
  }

  if (limitNum < 1 || limitNum > 100) {
    throw new Error('Limit must be between 1 and 100');
  }

  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    take: limitNum,
    page: pageNum
  };
}

/**
 * Parse sort parameters
 */
export function parseSort(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): { orderBy: any } | null {
  if (!sortBy) {
    return null;
  }

  const order = sortOrder || 'asc';

  return {
    orderBy: {
      [sortBy]: order
    }
  };
}

/**
 * Build search filter for text fields
 */
export function buildTextFilter(
  query?: string,
  fields: string[] = []
): any | null {
  if (!query || fields.length === 0) {
    return null;
  }

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: query,
        mode: 'insensitive'
      }
    }))
  };
}

/**
 * Sanitize search query
 */
export function sanitizeQuery(query: string): string {
  // Remove special characters that might cause issues
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 200); // Limit length
}

/**
 * Parse guests/passengers count
 */
export function parseGuestCount(
  guests?: string | number,
  defaultValue: number = 1
): number {
  if (!guests) {
    return defaultValue;
  }

  const count = parseInt(guests.toString());

  if (isNaN(count) || count < 1 || count > 20) {
    throw new Error('Guest count must be between 1 and 20');
  }

  return count;
}

/**
 * Parse room count
 */
export function parseRoomCount(
  rooms?: string | number,
  defaultValue: number = 1
): number {
  if (!rooms) {
    return defaultValue;
  }

  const count = parseInt(rooms.toString());

  if (isNaN(count) || count < 1 || count > 10) {
    throw new Error('Room count must be between 1 and 10');
  }

  return count;
}

/**
 * Validate destination
 */
export function validateDestination(destination?: string): string {
  if (!destination || destination.trim().length === 0) {
    throw new Error('Destination is required');
  }

  if (destination.length < 2) {
    throw new Error('Destination must be at least 2 characters');
  }

  if (destination.length > 100) {
    throw new Error('Destination is too long');
  }

  return sanitizeQuery(destination);
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}

/**
 * Extract unique values from array
 */
export function extractUnique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Filter falsy values from object
 */
export function filterFalsy(obj: Record<string, any>): Record<string, any> {
  return Object.entries(obj)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}

/**
 * Generate cache key for search
 */
export function generateSearchCacheKey(params: Record<string, any>): string {
  const sortedKeys = Object.keys(params).sort();
  const keyParts = sortedKeys.map(key => `${key}:${params[key]}`);
  return `search:${keyParts.join('|')}`;
}

/**
 * Calculate average rating
 */
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Check if date is weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  discountedPrice: number
): number {
  if (originalPrice <= 0) return 0;
  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discount);
}
