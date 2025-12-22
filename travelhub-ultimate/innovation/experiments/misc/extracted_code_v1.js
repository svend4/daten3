const axios = require('axios');

// Ваши credentials
const TRAVELPAYOUTS_TOKEN = 'your_token_here';
const MARKER = 'your_marker';

// Base URLs
const AUTOCOMPLETE_URL = 'https://autocomplete.travelpayouts.com/places2';
const SEARCH_URL = 'https://engine.hotellook.com/api/v2';

/**
 * Шаг 1: Найти город по названию
 */
async function findCity(query) {
  try {
    const response = await axios.get(AUTOCOMPLETE_URL, {
      params: {
        term: query,
        locale: 'en',
        types: 'city'
      }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0]; // Первый результат
    }
    
    throw new Error('City not found');
  } catch (error) {
    console.error('City search error:', error.message);
    throw error;
  }
}

/**
 * Шаг 2: Запустить поиск отелей
 */
async function startHotelSearch(cityId, checkIn, checkOut, adults) {
  try {
    const response = await axios.get(`${SEARCH_URL}/search/start`, {
      params: {
        locationId: cityId,
        checkIn: checkIn,        // YYYY-MM-DD
        checkOut: checkOut,      // YYYY-MM-DD
        adultsCount: adults,
        currency: 'USD',
        customerIP: '1.1.1.1',   // IP пользователя (можно любой)
        lang: 'en'
      },
      headers: {
        'Authorization': `Token ${TRAVELPAYOUTS_TOKEN}`
      }
    });
    
    return response.data.searchId;
  } catch (error) {
    console.error('Hotel search start error:', error.message);
    throw error;
  }
}

/**
 * Шаг 3: Получить результаты поиска
 */
async function getHotelResults(searchId) {
  try {
    // Подождать 2-3 секунды (поиск занимает время)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const response = await axios.get(`${SEARCH_URL}/search/results`, {
      params: {
        searchId: searchId,
        limit: 20
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Hotel results error:', error.message);
    throw error;
  }
}

/**
 * Полный workflow поиска отелей
 */
async function searchHotels(cityName, checkIn, checkOut, adults = 2) {
  try {
    console.log(`Searching hotels in ${cityName}...`);
    
    // 1. Найти город
    const city = await findCity(cityName);
    console.log(`Found city: ${city.name} (ID: ${city.id})`);
    
    // 2. Запустить поиск
    const searchId = await startHotelSearch(city.id, checkIn, checkOut, adults);
    console.log(`Search started: ${searchId}`);
    
    // 3. Получить результаты
    const results = await getHotelResults(searchId);
    console.log(`Found ${results.hotels?.length || 0} hotels`);
    
    // 4. Форматировать результаты
    const hotels = formatHotels(results, city);
    
    return hotels;
  } catch (error) {
    console.error('Hotel search failed:', error.message);
    throw error;
  }
}

/**
 * Форматирование результатов
 */
function formatHotels(results, city) {
  if (!results.hotels || results.hotels.length === 0) {
    return [];
  }
  
  return results.hotels.map(hotel => {
    const minRate = hotel.rates?.[0];
    
    return {
      id: hotel.id,
      name: hotel.name,
      stars: hotel.stars,
      rating: hotel.rating,
      address: hotel.address,
      location: {
        city: city.name,
        lat: hotel.location?.lat,
        lng: hotel.location?.lon
      },
      price: {
        amount: minRate?.daily_prices?.[0],
        currency: 'USD',
        total: minRate?.total_price
      },
      image: hotel.main_photo_url,
      amenities: hotel.amenities || [],
      url: generateHotelUrl(hotel.id, city.id, results.searchId)
    };
  });
}

/**
 * Генерация партнёрской ссылки
 */
function generateHotelUrl(hotelId, cityId, searchId) {
  return `https://www.hotellook.com/hotels/${cityId}?` +
         `hotelId=${hotelId}&searchId=${searchId}&marker=${MARKER}`;
}

// ============================================
// ИСПОЛЬЗОВАНИЕ
// ============================================

// Пример 1: Поиск отелей в Париже
searchHotels('Paris', '2025-12-01', '2025-12-05', 2)
  .then(hotels => {
    console.log('\n=== RESULTS ===');
    hotels.forEach((hotel, index) => {
      console.log(`\n${index + 1}. ${hotel.name} (${hotel.stars}⭐)`);
      console.log(`   Price: $${hotel.price.amount}/night`);
      console.log(`   Rating: ${hotel.rating}/10`);
      console.log(`   URL: ${hotel.url}`);
    });
  })
  .catch(error => {
    console.error('Search failed:', error);
  });
