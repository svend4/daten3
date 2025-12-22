import { describe, it, expect } from 'vitest';

// Mock validator (будет реализован позже)
const validateFlightSearch = (params: any) => {
  const errors: any[] = [];

  // Validate origin (IATA code - 3 letters)
  if (!params.origin || params.origin.length !== 3) {
    errors.push({ field: 'origin', message: 'Invalid IATA code' });
  }

  // Validate destination
  if (!params.destination || params.destination.length !== 3) {
    errors.push({ field: 'destination', message: 'Invalid IATA code' });
  }

  // Validate departDate
  if (!params.departDate) {
    errors.push({ field: 'departDate', message: 'Departure date is required' });
  } else {
    const departDate = new Date(params.departDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (departDate < today) {
      errors.push({ field: 'departDate', message: 'Departure date cannot be in the past' });
    }
  }

  // Validate returnDate if provided
  if (params.returnDate) {
    const departDate = new Date(params.departDate);
    const returnDate = new Date(params.returnDate);

    if (returnDate < departDate) {
      errors.push({ field: 'returnDate', message: 'Return date must be after departure date' });
    }
  }

  // Apply defaults
  const data = {
    ...params,
    adults: params.adults || 1,
    children: params.children || 0,
    cabinClass: params.cabinClass || 'economy',
  };

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data,
  };
};

describe('Flight Validator', () => {
  describe('validateFlightSearch', () => {
    it('should validate correct flight search params', () => {
      const params = {
        origin: 'MOW',
        destination: 'LON',
        departDate: '2025-12-01',
        returnDate: '2025-12-10',
        adults: 2,
      };

      const result = validateFlightSearch(params);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.data).toMatchObject(params);
    });

    it('should reject invalid IATA codes', () => {
      const params = {
        origin: 'INVALID',
        destination: 'LON',
        departDate: '2025-12-01',
      };

      const result = validateFlightSearch(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].field).toBe('origin');
    });

    it('should reject past dates', () => {
      const params = {
        origin: 'MOW',
        destination: 'LON',
        departDate: '2020-01-01',
      };

      const result = validateFlightSearch(params);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some((e: any) => e.field === 'departDate')).toBe(true);
    });

    it('should reject return date before departure', () => {
      const params = {
        origin: 'MOW',
        destination: 'LON',
        departDate: '2025-12-10',
        returnDate: '2025-12-01',
      };

      const result = validateFlightSearch(params);

      expect(result.isValid).toBe(false);
    });

    it('should apply default values', () => {
      const params = {
        origin: 'MOW',
        destination: 'LON',
        departDate: '2025-12-01',
      };

      const result = validateFlightSearch(params);

      expect(result.data.adults).toBe(1);
      expect(result.data.children).toBe(0);
      expect(result.data.cabinClass).toBe('economy');
    });

    it('should require origin', () => {
      const params = {
        destination: 'LON',
        departDate: '2025-12-01',
      };

      const result = validateFlightSearch(params);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some((e: any) => e.field === 'origin')).toBe(true);
    });

    it('should require destination', () => {
      const params = {
        origin: 'MOW',
        departDate: '2025-12-01',
      };

      const result = validateFlightSearch(params);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some((e: any) => e.field === 'destination')).toBe(true);
    });
  });
});
