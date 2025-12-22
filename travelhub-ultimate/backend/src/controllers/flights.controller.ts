import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import { searchFlights as searchFlightsTravelpayouts } from '../services/travelpayouts.service.js';

/**
 * Search for flights
 * GET /api/flights/search
 */
export const searchFlights = async (req: Request, res: Response) => {
  try {
    const {
      origin,
      destination,
      departDate,
      returnDate,
      passengers,
      currency
    } = req.query;

    // Validation
    if (!origin || !destination || !departDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: origin, destination, departDate'
      });
    }

    logger.info(`Flight search: ${origin} → ${destination} on ${departDate}`);

    // Search flights via Travelpayouts API
    const result = await searchFlightsTravelpayouts({
      origin: origin as string,
      destination: destination as string,
      departDate: departDate as string,
      returnDate: returnDate as string | undefined,
      adults: passengers ? parseInt(passengers as string) : 1,
      currency: (currency as string) || 'usd',
      limit: 30
    });

    res.json({
      success: result.success,
      data: {
        flights: result.flights,
        searchParams: {
          origin,
          destination,
          departDate,
          returnDate,
          passengers: passengers || 1
        },
        count: result.count
      },
      ...(result.usingMockData && {
        message: 'Using mock data - Travelpayouts API unavailable',
        error: result.error
      })
    });
  } catch (error: any) {
    logger.error('Error searching flights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search flights'
    });
  }
};

/**
 * Get flight details by ID
 * GET /api/flights/:id
 */
export const getFlightDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Flight ID is required'
      });
    }

    logger.info(`Fetching flight details for: ${id}`);

    // TODO: Integrate with flight details API
    // For now, return mock detailed data

    const mockFlightDetails = {
      id,
      airline: {
        code: 'SU',
        name: 'Aeroflot',
        logo: 'https://example.com/airlines/su.png'
      },
      aircraft: {
        type: 'Boeing 737-800',
        registration: 'VQ-BVP'
      },
      route: {
        origin: {
          code: 'SVO',
          city: 'Москва',
          airport: 'Шереметьево',
          terminal: 'D'
        },
        destination: {
          code: 'LED',
          city: 'Санкт-Петербург',
          airport: 'Пулково',
          terminal: '1'
        }
      },
      schedule: {
        departDate: '2025-12-25',
        departTime: '10:30',
        arriveDate: '2025-12-25',
        arriveTime: '12:15',
        duration: '1h 45m'
      },
      pricing: {
        economy: {
          available: true,
          price: 5500,
          currency: 'RUB',
          seatsLeft: 12
        },
        business: {
          available: true,
          price: 15000,
          currency: 'RUB',
          seatsLeft: 4
        }
      },
      amenities: [
        'Wi-Fi',
        'In-flight entertainment',
        'Meals included'
      ],
      baggage: {
        carryOn: '10 kg',
        checked: '23 kg'
      },
      bookable: true
    };

    res.json({
      success: true,
      data: mockFlightDetails,
      message: 'Flight details (mock data - API integration pending)'
    });
  } catch (error: any) {
    logger.error('Error fetching flight details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flight details'
    });
  }
};

/**
 * Get popular flight destinations
 * GET /api/flights/popular/destinations
 */
export const getPopularDestinations = async (req: Request, res: Response) => {
  try {
    const { from } = req.query;

    logger.info(`Fetching popular destinations from: ${from || 'all cities'}`);

    // TODO: Integrate with travel data API for real popular destinations
    // For now, return mock data

    const mockPopularDestinations = [
      {
        city: 'Париж',
        country: 'Франция',
        code: 'CDG',
        image: 'https://example.com/destinations/paris.jpg',
        averagePrice: 18500,
        currency: 'RUB',
        description: 'Город любви и света',
        popularMonths: ['мая', 'июня', 'сентября']
      },
      {
        city: 'Дубай',
        country: 'ОАЭ',
        code: 'DXB',
        image: 'https://example.com/destinations/dubai.jpg',
        averagePrice: 22000,
        currency: 'RUB',
        description: 'Современный город чудес',
        popularMonths: ['октября', 'ноября', 'марта']
      },
      {
        city: 'Стамбул',
        country: 'Турция',
        code: 'IST',
        image: 'https://example.com/destinations/istanbul.jpg',
        averagePrice: 12000,
        currency: 'RUB',
        description: 'Мост между Европой и Азией',
        popularMonths: ['апреля', 'мая', 'сентября']
      },
      {
        city: 'Барселона',
        country: 'Испания',
        code: 'BCN',
        image: 'https://example.com/destinations/barcelona.jpg',
        averagePrice: 16500,
        currency: 'RUB',
        description: 'Архитектура Гауди и пляжи',
        popularMonths: ['мая', 'июня', 'сентября']
      },
      {
        city: 'Токио',
        country: 'Япония',
        code: 'NRT',
        image: 'https://example.com/destinations/tokyo.jpg',
        averagePrice: 35000,
        currency: 'RUB',
        description: 'Традиции встречаются с будущим',
        popularMonths: ['марта', 'апреля', 'октября']
      }
    ];

    res.json({
      success: true,
      data: {
        destinations: mockPopularDestinations,
        count: mockPopularDestinations.length
      },
      message: 'Popular destinations (mock data - API integration pending)'
    });
  } catch (error: any) {
    logger.error('Error fetching popular destinations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular destinations'
    });
  }
};

/**
 * Search multi-city flights
 * POST /api/flights/multi-city
 */
export const searchMultiCity = async (req: Request, res: Response) => {
  try {
    const { legs, adults, children, infants, cabinClass } = req.body;

    logger.info(`Searching multi-city flights with ${legs.length} legs`);

    // Mock implementation
    const results = legs.map((leg: any, index: number) => ({
      legNumber: index + 1,
      origin: leg.origin,
      destination: leg.destination,
      departDate: leg.departDate,
      flights: [
        {
          id: `flight_${index}_1`,
          airline: 'AA',
          flightNumber: `AA${1000 + index}`,
          departure: { airport: leg.origin, time: '10:00' },
          arrival: { airport: leg.destination, time: '14:00' },
          duration: 240,
          price: 250 + index * 50,
          currency: 'USD',
          stops: 0,
        },
      ],
    }));

    res.json({
      success: true,
      data: {
        legs: results,
        totalPrice: results.reduce((sum: number, leg: any) => sum + leg.flights[0].price, 0),
        currency: 'USD',
      },
    });
  } catch (error: any) {
    logger.error('Error searching multi-city flights:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Compare flights
 * GET /api/flights/compare
 */
export const compareFlights = async (req: Request, res: Response) => {
  try {
    const { flightIds, compareBy } = req.query;

    const ids = typeof flightIds === 'string' ? flightIds.split(',') : flightIds;
    const fields = compareBy ? (typeof compareBy === 'string' ? compareBy.split(',') : compareBy) : ['price', 'duration', 'stops'];

    logger.info(`Comparing ${ids.length} flights`);

    const comparison = {
      flights: ids.map((id: string, index: number) => ({
        id,
        airline: ['AA', 'UA', 'DL'][index] || 'AA',
        flightNumber: `FL${index + 1}`,
        price: 300 + index * 50,
        duration: 240 + index * 30,
        stops: index,
        departure: '10:00',
        arrival: '14:00',
      })),
      comparison: {
        bestPrice: ids[0],
        bestDuration: ids[0],
        bestStops: ids[0],
      },
      differences: [
        { field: 'price', range: [300, 450], difference: 150 },
        { field: 'duration', range: [240, 300], difference: 60 },
      ],
    };

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    logger.error('Error comparing flights:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get price prediction
 * GET /api/flights/price-prediction
 */
export const getPricePrediction = async (req: Request, res: Response) => {
  try {
    const { origin, destination, date } = req.query;

    logger.info(`Price prediction: ${origin} -> ${destination} on ${date}`);

    const currentPrice = 350;
    const predictedPrice = 320;

    const prediction = {
      route: { origin, destination },
      date,
      currentPrice,
      predictedPrice,
      confidence: 0.85,
      recommendation: predictedPrice < currentPrice ? 'wait' : 'buy_now',
      priceHistory: [
        { date: '2025-12-01', price: 380 },
        { date: '2025-12-08', price: 360 },
        { date: '2025-12-15', price: 350 },
        { date: '2025-12-22', price: 350 },
      ],
      factors: [
        { name: 'Seasonality', impact: -15 },
        { name: 'Demand', impact: 10 },
        { name: 'Days Until Departure', impact: -5 },
      ],
    };

    res.json({ success: true, data: prediction });
  } catch (error: any) {
    logger.error('Error getting price prediction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Calculate baggage fees
 * POST /api/flights/baggage
 */
export const calculateBaggage = async (req: Request, res: Response) => {
  try {
    const { flightId, airline, cabinClass, bags } = req.body;

    logger.info(`Calculating baggage for ${airline} flight ${flightId}`);

    const carryOnFee = bags.carryOn > 1 ? (bags.carryOn - 1) * 30 : 0;
    const checkedFee = bags.checked > (cabinClass === 'economy' ? 0 : 1) ?
      (bags.checked - (cabinClass === 'economy' ? 0 : 1)) * 50 : 0;

    const result = {
      carryOn: { included: 1, additional: bags.carryOn - 1, totalFee: carryOnFee },
      checked: { included: cabinClass === 'economy' ? 0 : 1, totalFee: checkedFee },
      totalFee: carryOnFee + checkedFee,
      currency: 'USD',
    };

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error calculating baggage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get seat map
 * GET /api/flights/:flightId/seat-map
 */
export const getSeatMap = async (req: Request, res: Response) => {
  try {
    const { flightId } = req.params;

    logger.info(`Getting seat map for flight ${flightId}`);

    const rows = [];
    for (let i = 1; i <= 30; i++) {
      rows.push({
        rowNumber: i,
        seats: ['A', 'B', 'C', 'D', 'E', 'F'].map(col => ({
          column: col,
          available: Math.random() > 0.3,
          price: i <= 5 ? 50 : 20,
          type: i <= 5 ? 'extra_legroom' : 'standard',
        })),
      });
    }

    res.json({
      success: true,
      data: { flightId, aircraft: 'Boeing 737-800', layout: '3-3', rows },
    });
  } catch (error: any) {
    logger.error('Error getting seat map:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Select seats
 * POST /api/flights/select-seats
 */
export const selectSeats = async (req: Request, res: Response) => {
  try {
    const { flightId, bookingId, passengers } = req.body;

    logger.info(`Selecting seats for booking ${bookingId}`);

    const selections = passengers.map((p: any) => ({
      passengerId: p.passengerId,
      seat: `${p.seat.row}${p.seat.column}`,
      price: p.seat.row <= 5 ? 50 : 20,
      confirmed: true,
    }));

    res.json({
      success: true,
      data: {
        flightId,
        bookingId,
        selections,
        totalFee: selections.reduce((sum: number, s: any) => sum + s.price, 0),
        currency: 'USD',
      },
    });
  } catch (error: any) {
    logger.error('Error selecting seats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Search flexible dates
 * GET /api/flights/flexible-dates
 */
export const searchFlexibleDates = async (req: Request, res: Response) => {
  try {
    const { origin, destination, baseDate, flexDays } = req.query;

    logger.info(`Searching flexible dates: ${origin} -> ${destination} ±${flexDays} days`);

    const days = parseInt(flexDays as string);
    const results = [];

    for (let i = -days; i <= days; i++) {
      const date = new Date(baseDate as string);
      date.setDate(date.getDate() + i);

      results.push({
        date: date.toISOString().split('T')[0],
        price: 300 + Math.abs(i) * 10 + Math.random() * 50,
        availability: Math.random() > 0.2 ? 'available' : 'limited',
      });
    }

    results.sort((a, b) => a.price - b.price);

    res.json({
      success: true,
      data: {
        origin,
        destination,
        baseDate,
        flexDays,
        results,
        bestPrice: results[0],
      },
    });
  } catch (error: any) {
    logger.error('Error searching flexible dates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get flight status
 * GET /api/flights/status
 */
export const getFlightStatus = async (req: Request, res: Response) => {
  try {
    const { flightNumber, date } = req.query;

    logger.info(`Getting status for flight ${flightNumber}`);

    const status = {
      flightNumber,
      date: date || new Date().toISOString().split('T')[0],
      airline: 'American Airlines',
      status: 'On Time',
      departure: {
        airport: 'JFK',
        scheduled: '10:00',
        estimated: '10:00',
        gate: 'A12',
      },
      arrival: {
        airport: 'LAX',
        scheduled: '14:00',
        estimated: '13:55',
        gate: 'B4',
      },
      updates: [
        { time: '09:00', message: 'Flight is on time' },
        { time: '09:30', message: 'Boarding will begin at 09:45' },
      ],
    };

    res.json({ success: true, data: status });
  } catch (error: any) {
    logger.error('Error getting flight status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
