/**
 * Car Rental Controller
 * Handles car rental search requests and affiliate link generation
 */

import { Request, Response } from 'express';
import { carRentalService } from '../services/carRental.service.js';
import logger from '../utils/logger.js';

/**
 * Search for car rentals
 * GET /api/cars/search
 */
export const searchCarRentals = async (req: Request, res: Response) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      dropoffDate,
      dropoffTime,
      driverAge,
      currency,
      language
    } = req.query;

    // Validation
    if (!pickupLocation || !pickupDate || !dropoffDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: pickupLocation, pickupDate, dropoffDate'
      });
    }

    logger.info(`Car rental search: ${pickupLocation} ${pickupDate} → ${dropoffDate}`);

    const result = await carRentalService.searchCarRentals({
      pickupLocation: pickupLocation as string,
      dropoffLocation: dropoffLocation as string | undefined,
      pickupDate: pickupDate as string,
      pickupTime: pickupTime as string | undefined,
      dropoffDate: dropoffDate as string,
      dropoffTime: dropoffTime as string | undefined,
      driverAge: driverAge ? parseInt(driverAge as string) : undefined,
      currency: currency as string | undefined,
      language: language as string | undefined
    });

    res.json({
      success: true,
      data: result.links,
      searchParams: result.searchParams,
      count: result.links.length,
      message: 'Car rental affiliate links generated successfully'
    });
  } catch (error: any) {
    logger.error('Error searching car rentals:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to search car rentals'
    });
  }
};

/**
 * Get popular car rental locations
 * GET /api/cars/popular/locations
 */
export const getPopularLocations = async (req: Request, res: Response) => {
  try {
    const locations = carRentalService.getPopularLocations();

    res.json({
      success: true,
      data: {
        locations,
        count: locations.length
      },
      message: 'Popular car rental locations'
    });
  } catch (error: any) {
    logger.error('Error fetching popular locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular locations'
    });
  }
};
