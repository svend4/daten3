import axios from 'axios';

// Travelpayouts API configuration
const TRAVELPAYOUTS_TOKEN = process.env.TRAVELPAYOUTS_TOKEN || '';
const MARKER = process.env.TRAVELPAYOUTS_MARKER || 'travelhub';

// API endpoints
const AUTOCOMPLETE_URL = 'https://autocomplete.travelpayouts.com/places2';
const HOTEL_SEARCH_URL = 'https://engine.hotellook.com/api/v2';

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
