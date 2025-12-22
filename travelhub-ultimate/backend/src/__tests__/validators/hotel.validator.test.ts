import { describe, it, expect } from 'vitest';

// Mock validator (будет реализован позже)
const validateHotelSearch = (params: any) => {
  const errors: any[] = [];

  // Validate destination
  if (!params.destination) {
    errors.push({ field: 'destination', message: 'Destination is required' });
  }

  // Validate checkIn
  if (!params.checkIn) {
    errors.push({ field: 'checkIn', message: 'Check-in date is required' });
  } else {
    const checkIn = new Date(params.checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      errors.push({ field: 'checkIn', message: 'Check-in date cannot be in the past' });
    }
  }

  // Validate checkOut
  if (!params.checkOut) {
    errors.push({ field: 'checkOut', message: 'Check-out date is required' });
  } else if (params.checkIn) {
    const checkIn = new Date(params.checkIn);
    const checkOut = new Date(params.checkOut);

    if (checkOut <= checkIn) {
      errors.push({ field: 'checkOut', message: 'Check-out must be after check-in' });
    }
  }

  // Apply defaults
  const data = {
    ...params,
    adults: params.adults || 2,
    children: params.children || 0,
    rooms: params.rooms || 1,
  };

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data,
  };
};

describe('Hotel Validator', () => {
  describe('validateHotelSearch', () => {
    it('should validate correct hotel search params', () => {
      const params = {
        destination: 'Paris',
        checkIn: '2025-12-01',
        checkOut: '2025-12-05',
        adults: 2,
        rooms: 1,
      };

      const result = validateHotelSearch(params);

      expect(result.isValid).toBe(true);
      expect(result.data).toMatchObject(params);
    });

    it('should reject checkout before checkin', () => {
      const params = {
        destination: 'Paris',
        checkIn: '2025-12-05',
        checkOut: '2025-12-01',
      };

      const result = validateHotelSearch(params);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some((e: any) => e.field === 'checkOut')).toBe(true);
    });

    it('should require destination', () => {
      const params = {
        checkIn: '2025-12-01',
        checkOut: '2025-12-05',
      };

      const result = validateHotelSearch(params);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some((e: any) => e.field === 'destination')).toBe(true);
    });

    it('should reject past check-in dates', () => {
      const params = {
        destination: 'Paris',
        checkIn: '2020-01-01',
        checkOut: '2020-01-05',
      };

      const result = validateHotelSearch(params);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some((e: any) => e.field === 'checkIn')).toBe(true);
    });

    it('should apply default values', () => {
      const params = {
        destination: 'Paris',
        checkIn: '2025-12-01',
        checkOut: '2025-12-05',
      };

      const result = validateHotelSearch(params);

      expect(result.data.adults).toBe(2);
      expect(result.data.children).toBe(0);
      expect(result.data.rooms).toBe(1);
    });

    it('should accept valid future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const params = {
        destination: 'London',
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: nextWeek.toISOString().split('T')[0],
        adults: 3,
        rooms: 2,
      };

      const result = validateHotelSearch(params);

      expect(result.isValid).toBe(true);
      expect(result.data.adults).toBe(3);
      expect(result.data.rooms).toBe(2);
    });
  });
});
