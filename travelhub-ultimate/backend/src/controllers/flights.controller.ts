import { Request, Response } from 'express';
import logger from '../utils/logger';
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
