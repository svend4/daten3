import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import * as travelpayoutsService from '../services/travelpayouts.service.js';
import {
  applyHotelFilters,
  sortHotels,
  paginateResults,
  calculatePriceStats,
} from '../utils/filterHelpers.js';

/**
 * Search for hotels
 * GET /api/hotels/search
 */
export const searchHotels = async (req: Request, res: Response) => {
  try {
    const {
      destination,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      currency
    } = req.query;

    logger.info(`Hotel search: ${destination}, ${checkIn} - ${checkOut}`);

    // Step 1: Find city
    const cities = await travelpayoutsService.searchLocation(destination as string);

    if (!cities || cities.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'City not found',
        message: `No cities found matching "${destination}"`
      });
    }

    const city = cities[0];

    // Step 2: Start hotel search
    const searchId = await travelpayoutsService.startHotelSearch({
      locationId: city.id,
      checkIn: checkIn as string,
      checkOut: checkOut as string,
      adultsCount: adults ? parseInt(adults as string) : 2,
      children: children ? parseInt(children as string) : 0,
      rooms: rooms ? parseInt(rooms as string) : 1,
      currency: (currency as string) || 'USD',
    });

    if (!searchId) {
      return res.status(500).json({
        success: false,
        error: 'Failed to start hotel search'
      });
    }

    // Step 3: Get hotel results (wait 3 seconds for search to complete)
    await new Promise(resolve => setTimeout(resolve, 3000));

    const results = await travelpayoutsService.getHotelResults(searchId);

    // Step 4: Format results
    let formattedResults = travelpayoutsService.formatHotelResults(results, city);

    // Step 5: Apply advanced filters
    const filters = {
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      starRating: req.query.starRating,
      guestRatingMin: req.query.guestRatingMin ? parseFloat(req.query.guestRatingMin as string) : undefined,
      guestRatingMax: req.query.guestRatingMax ? parseFloat(req.query.guestRatingMax as string) : undefined,
      distanceMax: req.query.distanceMax ? parseFloat(req.query.distanceMax as string) : undefined,
      amenities: req.query.amenities,
      propertyTypes: req.query.propertyTypes,
      freeCancellation: req.query.freeCancellation === 'true',
      payAtHotel: req.query.payAtHotel === 'true',
      dealsOnly: req.query.dealsOnly === 'true',
      wheelchairAccessible: req.query.wheelchairAccessible === 'true',
    };

    // Apply filters
    formattedResults = applyHotelFilters(formattedResults, filters);

    // Calculate price statistics
    const priceStats = calculatePriceStats(formattedResults);

    // Step 6: Sort results
    const sortBy = (req.query.sortBy as string) || 'price';
    const sortOrder = (req.query.sortOrder as string) || 'asc';
    formattedResults = sortHotels(formattedResults, sortBy, sortOrder);

    // Step 7: Paginate results
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const paginated = paginateResults(formattedResults, page, limit);

    res.json({
      success: true,
      data: {
        city: {
          id: city.id,
          name: city.name,
          country: city.country,
        },
        searchId,
        hotels: paginated.data,
        count: paginated.data.length,
        totalCount: formattedResults.length,
        pagination: paginated.pagination,
        priceStats,
        filters: {
          applied: Object.keys(filters).filter(key => filters[key as keyof typeof filters] !== undefined),
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error searching hotels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search hotels',
      message: error.message
    });
  }
};

/**
 * Get hotel details by ID
 * GET /api/hotels/:id
 */
export const getHotelDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info(`Fetching hotel details for: ${id}`);

    // TODO: Implement actual hotel details API
    // For now, return mock data
    const mockHotelDetails = {
      id,
      name: 'Sample Hotel',
      address: {
        street: '123 Main St',
        city: 'Paris',
        country: 'France',
        postalCode: '75001',
      },
      location: {
        latitude: 48.8566,
        longitude: 2.3522,
      },
      rating: 4.5,
      stars: 4,
      amenities: [
        'Free Wi-Fi',
        'Breakfast included',
        'Air conditioning',
        'Swimming pool',
        'Parking',
        'Restaurant',
      ],
      images: [
        'https://example.com/hotel1.jpg',
        'https://example.com/hotel2.jpg',
      ],
      description: 'A beautiful hotel in the heart of Paris',
      rooms: [
        {
          type: 'Standard Room',
          price: 150,
          currency: 'USD',
          available: true,
        },
        {
          type: 'Deluxe Room',
          price: 250,
          currency: 'USD',
          available: true,
        },
      ],
    };

    res.json({
      success: true,
      data: mockHotelDetails,
      message: 'Hotel details (mock data - API integration pending)'
    });
  } catch (error: any) {
    logger.error('Error fetching hotel details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hotel details'
    });
  }
};

/**
 * Autocomplete for hotel/city search
 * GET /api/hotels/autocomplete
 */
export const autocompleteHotels = async (req: Request, res: Response) => {
  try {
    const { query, locale } = req.query;

    logger.info(`Hotel autocomplete: ${query}`);

    const results = await travelpayoutsService.searchLocation(
      query as string
    );

    res.json({
      success: true,
      data: {
        suggestions: results.map((city: any) => ({
          id: city.id,
          name: city.name,
          country: city.country,
          type: city.type,
        })),
        count: results.length,
      },
    });
  } catch (error: any) {
    logger.error('Error in hotel autocomplete:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions'
    });
  }
};
