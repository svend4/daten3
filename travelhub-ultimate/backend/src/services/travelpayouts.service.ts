import axios from 'axios';
import { cacheService, CACHE_TTL } from './cache.service.js';
import logger from '../utils/logger.js';

// Travelpayouts API configuration
const TRAVELPAYOUTS_TOKEN = process.env.TRAVELPAYOUTS_TOKEN || '';
const MARKER = process.env.TRAVELPAYOUTS_MARKER || 'travelhub';

// API endpoints
const AUTOCOMPLETE_URL = 'https://autocomplete.travelpayouts.com/places2';
const HOTEL_SEARCH_URL = 'https://engine.hotellook.com/api/v2';
const FLIGHTS_API_URL = 'https://api.travelpayouts.com';

interface City {
  id: string;
  name: string;
  country_name?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

interface HotelSearchParams {
  destination: string;
  checkIn: string;  // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  rooms?: number;
}

interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
  currency?: string;
  limit?: number;
}

/**
 * Find city by name
 */
export async function findCity(query: string): Promise<City> {
  try {
    const response = await axios.get(AUTOCOMPLETE_URL, {
      params: {
        term: query,
        locale: 'en',
        types: 'city'
      }
    });

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    throw new Error(`City not found: ${query}`);
  } catch (error: any) {
    console.error('❌ City search error:', error.message);
    throw new Error(`Failed to find city: ${error.message}`);
  }
}

/**
 * Start hotel search
 */
async function startHotelSearch(
  cityId: string,
  checkIn: string,
  checkOut: string,
  adults: number
): Promise<string> {
  try {
    const response = await axios.get(`${HOTEL_SEARCH_URL}/search/start`, {
      params: {
        locationId: cityId,
        checkIn,
        checkOut,
        adultsCount: adults,
        currency: 'USD',
        customerIP: '1.1.1.1',
        lang: 'en',
        marker: MARKER
      },
      headers: TRAVELPAYOUTS_TOKEN ? {
        'Authorization': `Token ${TRAVELPAYOUTS_TOKEN}`
      } : {}
    });

    return response.data.searchId;
  } catch (error: any) {
    console.error('❌ Hotel search start error:', error.message);
    throw new Error(`Failed to start hotel search: ${error.message}`);
  }
}

/**
 * Get hotel search results
 */
async function getHotelResults(searchId: string): Promise<any> {
  try {
    // Wait for search to complete (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));

    const response = await axios.get(`${HOTEL_SEARCH_URL}/search/results`, {
      params: {
        searchId,
        limit: 20
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Hotel results error:', error.message);
    throw new Error(`Failed to get hotel results: ${error.message}`);
  }
}

/**
 * Full hotel search workflow
 */
export async function searchHotels(params: HotelSearchParams): Promise<any> {
  try {
    console.log(`🔍 Searching hotels in ${params.destination}...`);

    // 1. Find city
    const city = await findCity(params.destination);
    console.log(`✅ Found city: ${city.name} (ID: ${city.id})`);

    // 2. Start search
    const searchId = await startHotelSearch(
      city.id,
      params.checkIn,
      params.checkOut,
      params.adults
    );
    console.log(`✅ Search started: ${searchId}`);

    // 3. Get results
    const results = await getHotelResults(searchId);
    console.log(`✅ Found ${results?.hotels?.length || 0} hotels`);

    return {
      city: {
        id: city.id,
        name: city.name,
        country: city.country_name
      },
      searchId,
      hotels: results?.hotels || [],
      totalCount: results?.hotels?.length || 0
    };
  } catch (error: any) {
    console.error('❌ Hotel search error:', error.message);

    // Return mock data if API fails
    return {
      city: {
        id: 'unknown',
        name: params.destination,
        country: 'Unknown'
      },
      searchId: 'mock',
      hotels: generateMockHotels(params.destination),
      totalCount: 5,
      error: error.message,
      usingMockData: true
    };
  }
}

/**
 * Search flights via Travelpayouts API
 */
export async function searchFlights(params: FlightSearchParams): Promise<any> {
  const cacheKey = cacheService.generateKey('flights', params);

  // Check cache
  const cached = await cacheService.getJSON(cacheKey);
  if (cached) {
    logger.info('Returning cached flight results');
    return cached;
  }

  try {
    logger.info('Searching flights:', params);

    const response = await axios.get(
      `${FLIGHTS_API_URL}/aviasales/v3/prices_for_dates`,
      {
        params: {
          origin: params.origin,
          destination: params.destination,
          depart_date: params.departDate,
          return_date: params.returnDate,
          token: TRAVELPAYOUTS_TOKEN,
          currency: params.currency || 'usd',
          limit: params.limit || 30,
          sorting: 'price'
        },
        timeout: 15000
      }
    );

    if (!response.data.success) {
      throw new Error('API returned unsuccessful response');
    }

    const results = formatFlightResults(response.data.data);

    // Save to cache
    await cacheService.setJSON(cacheKey, results, CACHE_TTL.FLIGHTS_SEARCH);

    logger.info(`Found ${results.length} flights`);
    return {
      success: true,
      flights: results,
      count: results.length
    };
  } catch (error: any) {
    logger.error('Travelpayouts flight search error:', {
      message: error.message,
      params: params
    });

    // Return mock data as fallback
    return {
      success: false,
      flights: generateMockFlights(params),
      count: 5,
      error: error.message,
      usingMockData: true
    };
  }
}

/**
 * Location autocomplete
 */
export async function searchLocation(query: string): Promise<any[]> {
  const cacheKey = `location:${query}`;

  const cached = await cacheService.getJSON(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(AUTOCOMPLETE_URL, {
      params: {
        term: query,
        locale: 'en',
        types: 'city,airport'
      },
      timeout: 5000
    });

    const results = response.data || [];

    await cacheService.setJSON(cacheKey, results, CACHE_TTL.LONG);

    return results;
  } catch (error: any) {
    logger.error('Location search error:', error.message);
    return [];
  }
}

/**
 * Format flight results for frontend
 */
function formatFlightResults(data: any[]): any[] {
  if (!data || data.length === 0) {
    return [];
  }

  return data.map((flight) => ({
    id: `${flight.origin}-${flight.destination}-${flight.departure_at}`,
    airline: {
      code: flight.airline,
      name: getAirlineName(flight.airline)
    },
    origin: {
      code: flight.origin,
      airport: flight.origin_airport
    },
    destination: {
      code: flight.destination,
      airport: flight.destination_airport
    },
    departTime: flight.departure_at,
    arriveTime: flight.return_at,
    price: {
      amount: flight.price,
      currency: 'USD'
    },
    flightNumber: flight.flight_number,
    transfers: flight.transfers || 0,
    duration: flight.duration,
    class: 'economy',
    link: generateFlightUrl(flight)
  }));
}

/**
 * Generate affiliate link for flight
 */
function generateFlightUrl(flight: any): string {
  const origin = flight.origin;
  const dest = flight.destination;
  const depart = flight.departure_at.split('T')[0].replace(/-/g, '');
  const ret = flight.return_at
    ? flight.return_at.split('T')[0].replace(/-/g, '')
    : '';

  const search = `${origin}${depart}${dest}${ret}`;

  return `https://www.aviasales.com/search/${search}?marker=${MARKER}`;
}

/**
 * Get airline name from code
 */
function getAirlineName(code: string): string {
  const airlines: { [key: string]: string } = {
    BA: 'British Airways',
    LH: 'Lufthansa',
    AF: 'Air France',
    SU: 'Aeroflot',
    AA: 'American Airlines',
    UA: 'United Airlines',
    DL: 'Delta Air Lines',
    EK: 'Emirates',
    TK: 'Turkish Airlines',
    QR: 'Qatar Airways',
    KL: 'KLM Royal Dutch Airlines',
    IB: 'Iberia',
    AZ: 'ITA Airways',
    NH: 'ANA',
    JL: 'Japan Airlines',
    SQ: 'Singapore Airlines',
    CX: 'Cathay Pacific',
    EY: 'Etihad Airways'
  };
  return airlines[code] || code;
}

/**
 * Generate mock flight data (fallback when API fails)
 */
function generateMockFlights(params: FlightSearchParams): any[] {
  const baseDate = new Date(params.departDate);
  const returnDate = params.returnDate ? new Date(params.returnDate) : null;

  return [
    {
      id: `${params.origin}-${params.destination}-1`,
      airline: { code: 'SU', name: 'Aeroflot' },
      origin: { code: params.origin, airport: `${params.origin} Airport` },
      destination: { code: params.destination, airport: `${params.destination} Airport` },
      departTime: baseDate.toISOString(),
      arriveTime: returnDate?.toISOString(),
      price: { amount: 350, currency: 'USD' },
      flightNumber: 'SU123',
      transfers: 0,
      duration: 180,
      class: 'economy',
      link: `https://www.aviasales.com/search/?marker=${MARKER}`
    },
    {
      id: `${params.origin}-${params.destination}-2`,
      airline: { code: 'BA', name: 'British Airways' },
      origin: { code: params.origin, airport: `${params.origin} Airport` },
      destination: { code: params.destination, airport: `${params.destination} Airport` },
      departTime: baseDate.toISOString(),
      arriveTime: returnDate?.toISOString(),
      price: { amount: 420, currency: 'USD' },
      flightNumber: 'BA456',
      transfers: 1,
      duration: 240,
      class: 'economy',
      link: `https://www.aviasales.com/search/?marker=${MARKER}`
    },
    {
      id: `${params.origin}-${params.destination}-3`,
      airline: { code: 'LH', name: 'Lufthansa' },
      origin: { code: params.origin, airport: `${params.origin} Airport` },
      destination: { code: params.destination, airport: `${params.destination} Airport` },
      departTime: baseDate.toISOString(),
      arriveTime: returnDate?.toISOString(),
      price: { amount: 380, currency: 'USD' },
      flightNumber: 'LH789',
      transfers: 0,
      duration: 195,
      class: 'economy',
      link: `https://www.aviasales.com/search/?marker=${MARKER}`
    },
    {
      id: `${params.origin}-${params.destination}-4`,
      airline: { code: 'TK', name: 'Turkish Airlines' },
      origin: { code: params.origin, airport: `${params.origin} Airport` },
      destination: { code: params.destination, airport: `${params.destination} Airport` },
      departTime: baseDate.toISOString(),
      arriveTime: returnDate?.toISOString(),
      price: { amount: 320, currency: 'USD' },
      flightNumber: 'TK321',
      transfers: 1,
      duration: 220,
      class: 'economy',
      link: `https://www.aviasales.com/search/?marker=${MARKER}`
    },
    {
      id: `${params.origin}-${params.destination}-5`,
      airline: { code: 'EK', name: 'Emirates' },
      origin: { code: params.origin, airport: `${params.origin} Airport` },
      destination: { code: params.destination, airport: `${params.destination} Airport` },
      departTime: baseDate.toISOString(),
      arriveTime: returnDate?.toISOString(),
      price: { amount: 550, currency: 'USD' },
      flightNumber: 'EK654',
      transfers: 0,
      duration: 165,
      class: 'economy',
      link: `https://www.aviasales.com/search/?marker=${MARKER}`
    }
  ];
}

/**
 * Generate mock hotel data (fallback when API fails)
 */
function generateMockHotels(destination: string) {
  return [
    {
      id: 'hotel_1',
      name: `Grand Hotel ${destination}`,
      stars: 5,
      rating: 4.8,
      price: 150,
      currency: 'USD',
      image: 'https://via.placeholder.com/400x300',
      amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant']
    },
    {
      id: 'hotel_2',
      name: `Luxury Suites ${destination}`,
      stars: 4,
      rating: 4.5,
      price: 120,
      currency: 'USD',
      image: 'https://via.placeholder.com/400x300',
      amenities: ['WiFi', 'Breakfast', 'Parking']
    },
    {
      id: 'hotel_3',
      name: `Budget Inn ${destination}`,
      stars: 3,
      rating: 4.0,
      price: 60,
      currency: 'USD',
      image: 'https://via.placeholder.com/400x300',
      amenities: ['WiFi', 'Parking']
    },
    {
      id: 'hotel_4',
      name: `City Center Hotel ${destination}`,
      stars: 4,
      rating: 4.3,
      price: 95,
      currency: 'USD',
      image: 'https://via.placeholder.com/400x300',
      amenities: ['WiFi', 'Restaurant', 'Bar']
    },
    {
      id: 'hotel_5',
      name: `Boutique ${destination}`,
      stars: 4,
      rating: 4.6,
      price: 110,
      currency: 'USD',
      image: 'https://via.placeholder.com/400x300',
      amenities: ['WiFi', 'Spa', 'Concierge']
    }
  ];
}
