/**
 * Smart Recommendations Service
 * AI-powered recommendations based on user history and preferences
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export interface RecommendationRequest {
  userId: string;
  type: 'hotels' | 'flights' | 'destinations';
  context?: {
    location?: string;
    budget?: { min: number; max: number };
    dates?: { start: string; end: string };
    preferences?: string[];
  };
  limit?: number;
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  image?: string;
  price?: number;
  rating?: number;
  score: number; // relevance score 0-1
  reasons: string[];
  link: string;
}

/**
 * Get personalized recommendations
 */
export async function getRecommendations(
  request: RecommendationRequest
): Promise<Recommendation[]> {
  try {
    logger.info(`Getting recommendations for user ${request.userId}, type: ${request.type}`);

    // Get user history
    const userBookings = await prisma.booking.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get user favorites
    const userFavorites = await prisma.favorite.findMany({
      where: { userId: request.userId },
      take: 10,
    });

    // Analyze preferences
    const preferences = analyzeUserPreferences(userBookings, userFavorites);

    // Generate recommendations based on type
    switch (request.type) {
      case 'hotels':
        return await recommendHotels(preferences, request.context, request.limit || 10);

      case 'flights':
        return await recommendFlights(preferences, request.context, request.limit || 10);

      case 'destinations':
        return await recommendDestinations(preferences, request.context, request.limit || 10);

      default:
        return [];
    }
  } catch (error: any) {
    logger.error('Error getting recommendations:', error);
    throw error;
  }
}

/**
 * Analyze user preferences from history
 */
function analyzeUserPreferences(bookings: any[], favorites: any[]): any {
  const preferences: any = {
    avgBudget: 0,
    preferredDestinations: [],
    preferredHotelStars: [],
    preferredAmenities: [],
    travelFrequency: 'occasional',
  };

  // Calculate average budget
  if (bookings.length > 0) {
    const totalSpent = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    preferences.avgBudget = totalSpent / bookings.length;
  }

  // Extract preferred destinations
  const destinations = new Map();
  bookings.forEach(b => {
    const dest = b.destination || 'Unknown';
    destinations.set(dest, (destinations.get(dest) || 0) + 1);
  });
  preferences.preferredDestinations = Array.from(destinations.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([dest]) => dest);

  // Determine travel frequency
  if (bookings.length > 10) {
    preferences.travelFrequency = 'frequent';
  } else if (bookings.length > 3) {
    preferences.travelFrequency = 'regular';
  }

  return preferences;
}

/**
 * Recommend hotels
 */
async function recommendHotels(
  preferences: any,
  context: any,
  limit: number
): Promise<Recommendation[]> {
  // Mock hotel recommendations
  const mockHotels = [
    {
      id: 'hotel_1',
      type: 'hotel',
      title: 'Grand Hotel Central',
      description: 'Luxury hotel in city center',
      image: 'https://via.placeholder.com/400x300',
      price: preferences.avgBudget * 1.1,
      rating: 4.7,
      score: 0.95,
      reasons: [
        'Matches your budget',
        'Located in preferred destination',
        'High rating (4.7/5)',
      ],
      link: '/hotels/hotel_1',
    },
    {
      id: 'hotel_2',
      type: 'hotel',
      title: 'Boutique Residence',
      description: 'Charming boutique hotel',
      image: 'https://via.placeholder.com/400x300',
      price: preferences.avgBudget * 0.8,
      rating: 4.5,
      score: 0.88,
      reasons: [
        'Great value for money',
        'Similar to your previous stays',
        'Free cancellation',
      ],
      link: '/hotels/hotel_2',
    },
  ];

  return mockHotels.slice(0, limit);
}

/**
 * Recommend flights
 */
async function recommendFlights(
  preferences: any,
  context: any,
  limit: number
): Promise<Recommendation[]> {
  // Mock flight recommendations
  const mockFlights = [
    {
      id: 'flight_1',
      type: 'flight',
      title: 'Direct flight to Paris',
      description: 'Non-stop, perfect timing',
      price: 450,
      rating: 4.6,
      score: 0.92,
      reasons: [
        'Direct flight (no stops)',
        'Departure at your preferred time',
        '20% below average price',
      ],
      link: '/flights/flight_1',
    },
  ];

  return mockFlights.slice(0, limit);
}

/**
 * Recommend destinations
 */
async function recommendDestinations(
  preferences: any,
  context: any,
  limit: number
): Promise<Recommendation[]> {
  // Mock destination recommendations
  const mockDestinations = [
    {
      id: 'dest_1',
      type: 'destination',
      title: 'Barcelona, Spain',
      description: 'Vibrant city with beautiful architecture',
      image: 'https://via.placeholder.com/600x400',
      price: 800,
      rating: 4.8,
      score: 0.94,
      reasons: [
        'Popular among travelers with similar preferences',
        'Great weather in your travel dates',
        'Affordable compared to other European cities',
      ],
      link: '/destinations/barcelona',
    },
    {
      id: 'dest_2',
      type: 'destination',
      title: 'Tokyo, Japan',
      description: 'Modern metropolis meets traditional culture',
      image: 'https://via.placeholder.com/600x400',
      price: 1200,
      rating: 4.9,
      score: 0.89,
      reasons: [
        'On your wishlist',
        'Best time to visit',
        'Amazing food scene',
      ],
      link: '/destinations/tokyo',
    },
  ];

  return mockDestinations.slice(0, limit);
}

/**
 * Get similar hotels
 */
export async function getSimilarHotels(hotelId: string, limit: number = 5): Promise<Recommendation[]> {
  logger.info(`Getting similar hotels to: ${hotelId}`);

  // Mock similar hotels
  return [
    {
      id: 'similar_1',
      type: 'hotel',
      title: 'Similar Hotel 1',
      description: 'Similar amenities and location',
      price: 150,
      rating: 4.5,
      score: 0.85,
      reasons: ['Similar price range', 'Same neighborhood', '4-star rating'],
      link: '/hotels/similar_1',
    },
  ].slice(0, limit);
}

/**
 * Customers also booked
 */
export async function getCustomersAlsoBooked(
  bookingId: string,
  limit: number = 5
): Promise<Recommendation[]> {
  logger.info(`Getting "customers also booked" for: ${bookingId}`);

  // Find similar bookings (mock)
  return [
    {
      id: 'also_1',
      type: 'hotel',
      title: 'Frequently booked together',
      description: '80% of customers also booked this',
      price: 120,
      rating: 4.4,
      score: 0.80,
      reasons: ['Popular combination', 'Nearby location'],
      link: '/hotels/also_1',
    },
  ].slice(0, limit);
}

export default {
  getRecommendations,
  getSimilarHotels,
  getCustomersAlsoBooked,
};
