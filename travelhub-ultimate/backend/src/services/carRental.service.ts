/**
 * Car Rental Service
 * Generates affiliate deeplinks for car rental searches
 * Based on Innovation Library v3.js
 *
 * Supports: RentalCars.com, Discover Cars, and other providers
 */

import logger from '../utils/logger.js';

interface CarRentalSearchParams {
  pickupLocation: string;    // Location ID or name
  dropoffLocation?: string;  // If different from pickup
  pickupDate: string;        // YYYY-MM-DD
  pickupTime?: string;       // HH:MM
  dropoffDate: string;       // YYYY-MM-DD
  dropoffTime?: string;      // HH:MM
  driverAge?: number;        // Default: 30
  currency?: string;         // Default: USD
  language?: string;         // Default: en
}

interface CarRentalLink {
  provider: string;
  url: string;
  searchParams: CarRentalSearchParams;
}

class CarRentalService {
  private rentalcarsAffiliateId: string;
  private discovercarsAffiliateId: string;

  constructor() {
    this.rentalcarsAffiliateId = process.env.RENTALCARS_AFFILIATE_ID || 'travelhub';
    this.discovercarsAffiliateId = process.env.DISCOVERCARS_AFFILIATE_ID || 'travelhub';
  }

  /**
   * Generate affiliate link for RentalCars.com
   */
  generateRentalcarsLink(params: CarRentalSearchParams): CarRentalLink {
    const {
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime = '10:00',
      dropoffDate,
      dropoffTime = '10:00',
      driverAge = 30,
      currency = 'USD',
      language = 'en'
    } = params;

    // Format dates for RentalCars (DD/MM/YYYY)
    const formattedPickupDate = this.formatDateForRentalcars(pickupDate);
    const formattedDropoffDate = this.formatDateForRentalcars(dropoffDate);

    const baseUrl = 'https://www.rentalcars.com/Utilities/Affiliate/SearchRedirect.do';
    const queryParams = new URLSearchParams({
      affiliateCode: this.rentalcarsAffiliateId,
      language,
      currency,
      pickupLocationID: pickupLocation,
      dropoffLocationID: dropoffLocation || pickupLocation,
      pickupDate: formattedPickupDate,
      pickupTime,
      dropoffDate: formattedDropoffDate,
      dropoffTime,
      driverAge: driverAge.toString()
    });

    const url = `${baseUrl}?${queryParams}`;

    logger.info('Generated RentalCars affiliate link', {
      pickupLocation,
      pickupDate,
      dropoffDate,
      driverAge
    });

    return {
      provider: 'RentalCars',
      url,
      searchParams: params
    };
  }

  /**
   * Generate affiliate link for DiscoverCars
   */
  generateDiscovercarsLink(params: CarRentalSearchParams): CarRentalLink {
    const {
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime = '10:00',
      dropoffDate,
      dropoffTime = '10:00',
      driverAge = 30,
      currency = 'USD'
    } = params;

    const baseUrl = 'https://www.discovercars.com';
    const queryParams = new URLSearchParams({
      a_aid: this.discovercarsAffiliateId,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation || pickupLocation,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      dropoff_date: dropoffDate,
      dropoff_time: dropoffTime,
      driver_age: driverAge.toString(),
      currency
    });

    const url = `${baseUrl}/?${queryParams}`;

    logger.info('Generated DiscoverCars affiliate link', {
      pickupLocation,
      pickupDate,
      dropoffDate
    });

    return {
      provider: 'DiscoverCars',
      url,
      searchParams: params
    };
  }

  /**
   * Generate multiple affiliate links (all providers)
   */
  generateAllLinks(params: CarRentalSearchParams): CarRentalLink[] {
    return [
      this.generateRentalcarsLink(params),
      this.generateDiscovercarsLink(params)
    ];
  }

  /**
   * Search for car rentals (returns affiliate links)
   */
  async searchCarRentals(params: CarRentalSearchParams): Promise<{
    success: boolean;
    links: CarRentalLink[];
    searchParams: CarRentalSearchParams;
  }> {
    try {
      // Validate params
      this.validateSearchParams(params);

      const links = this.generateAllLinks(params);

      logger.info('Car rental search completed', {
        providers: links.length,
        pickupLocation: params.pickupLocation
      });

      return {
        success: true,
        links,
        searchParams: params
      };
    } catch (error: any) {
      logger.error('Car rental search error:', error);
      throw error;
    }
  }

  /**
   * Format date from YYYY-MM-DD to DD/MM/YYYY for RentalCars
   */
  private formatDateForRentalcars(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Validate search parameters
   */
  private validateSearchParams(params: CarRentalSearchParams): void {
    if (!params.pickupLocation) {
      throw new Error('Pickup location is required');
    }

    if (!params.pickupDate) {
      throw new Error('Pickup date is required');
    }

    if (!params.dropoffDate) {
      throw new Error('Dropoff date is required');
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(params.pickupDate) || !dateRegex.test(params.dropoffDate)) {
      throw new Error('Dates must be in YYYY-MM-DD format');
    }

    // Validate pickup is before dropoff
    const pickupDate = new Date(params.pickupDate);
    const dropoffDate = new Date(params.dropoffDate);

    if (pickupDate >= dropoffDate) {
      throw new Error('Dropoff date must be after pickup date');
    }

    // Validate not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickupDate < today) {
      throw new Error('Pickup date cannot be in the past');
    }

    // Validate driver age
    if (params.driverAge && (params.driverAge < 18 || params.driverAge > 100)) {
      throw new Error('Driver age must be between 18 and 100');
    }
  }

  /**
   * Get popular car rental locations
   */
  getPopularLocations(): Array<{ id: string; name: string; country: string }> {
    return [
      { id: '12345', name: 'Paris CDG Airport', country: 'France' },
      { id: '23456', name: 'Barcelona Airport', country: 'Spain' },
      { id: '34567', name: 'London Heathrow', country: 'UK' },
      { id: '45678', name: 'New York JFK', country: 'USA' },
      { id: '56789', name: 'Los Angeles LAX', country: 'USA' },
      { id: '67890', name: 'Dubai Airport', country: 'UAE' },
      { id: '78901', name: 'Rome Fiumicino', country: 'Italy' },
      { id: '89012', name: 'Amsterdam Schiphol', country: 'Netherlands' },
      { id: '90123', name: 'Tokyo Narita', country: 'Japan' },
      { id: '01234', name: 'Singapore Changi', country: 'Singapore' }
    ];
  }
}

// Export singleton instance
export const carRentalService = new CarRentalService();
export default carRentalService;
