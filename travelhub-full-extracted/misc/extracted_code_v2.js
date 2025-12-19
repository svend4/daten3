const axios = require('axios');

const AVIASALES_TOKEN = 'your_token_here';
const MARKER = 'your_marker';
const BASE_URL = 'https://api.travelpayouts.com/aviasales/v3';

/**
 * Поиск авиабилетов
 */
async function searchFlights(origin, destination, departDate, returnDate) {
  try {
    const response = await axios.get(`${BASE_URL}/prices_for_dates`, {
      params: {
        origin: origin,              // IATA код: MOW, LON, NYC
        destination: destination,
        departure_at: departDate,    // YYYY-MM-DD
        return_at: returnDate,       // YYYY-MM-DD (опционально)
        unique: false,
        sorting: 'price',
        direct: false,               // false = с пересадками тоже
        currency: 'usd',
        limit: 30,
        token: AVIASALES_TOKEN
      }
    });
    
    if (!response.data.success) {
      throw new Error('API returned error');
    }
    
    return formatFlights(response.data.data, origin, destination);
  } catch (error) {
    console.error('Flight search error:', error.message);
    throw error;
  }
}

/**
 * Форматирование результатов
 */
function formatFlights(flights, origin, destination) {
  return flights.map(flight => ({
    id: generateFlightId(flight),
    route: {
      origin: flight.origin,
      destination: flight.destination,
      originFull: flight.origin_airport || origin,
      destinationFull: flight.destination_airport || destination
    },
    dates: {
      departure: flight.departure_at,
      return: flight.return_at
    },
    price: {
      amount: flight.price,
      currency: 'USD'
    },
    airline: {
      code: flight.airline,
      name: getAirlineName(flight.airline)
    },
    flight_number: flight.flight_number,
    transfers: flight.transfers,
    duration: calculateDuration(flight),
    link: generateFlightUrl(flight)
  }));
}

/**
 * Генерация партнёрской ссылки
 */
function generateFlightUrl(flight) {
  const origin = flight.origin;
  const dest = flight.destination;
  const depart = flight.departure_at.split('T')[0].replace(/-/g, '');
  const ret = flight.return_at ? 
    flight.return_at.split('T')[0].replace(/-/g, '') : '';
  
  const search = `${origin}${depart}${dest}${ret}`;
  
  return `https://www.aviasales.com/search/${search}?marker=${MARKER}`;
}

/**
 * Расчёт длительности полёта
 */
function calculateDuration(flight) {
  // Упрощённый расчёт (в реальности - из API)
  const depart = new Date(flight.departure_at);
  const arrive = new Date(flight.return_at || flight.departure_at);
  const hours = Math.round((arrive - depart) / (1000 * 60 * 60));
  return `${hours}h`;
}

function generateFlightId(flight) {
  return `${flight.origin}-${flight.destination}-${flight.departure_at}`;
}

function getAirlineName(code) {
  // Словарь авиакомпаний (можно расширить)
  const airlines = {
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'SU': 'Aeroflot',
    'AA': 'American Airlines',
    // ...добавить остальные
  };
  return airlines[code] || code;
}

// ============================================
// ИСПОЛЬЗОВАНИЕ
// ============================================

// Пример 1: Москва → Лондон, туда-обратно
searchFlights('MOW', 'LON', '2025-12-01', '2025-12-10')
  .then(flights => {
    console.log('\n=== FLIGHT RESULTS ===');
    flights.forEach((flight, index) => {
      console.log(`\n${index + 1}. ${flight.airline.name} ${flight.flight_number}`);
      console.log(`   Route: ${flight.route.origin} → ${flight.route.destination}`);
      console.log(`   Price: $${flight.price.amount}`);
      console.log(`   Transfers: ${flight.transfers}`);
      console.log(`   Duration: ${flight.duration}`);
      console.log(`   URL: ${flight.link}`);
    });
  })
  .catch(error => {
    console.error('Search failed:', error);
  });

// Пример 2: В один конец
searchFlights('NYC', 'LAX', '2025-12-15', null)
  .then(flights => {
    console.log(`Found ${flights.length} flights`);
  });
