const { validateFlightSearch, validateHotelSearch } = require('../../src/utils/validators');

describe('Validators', () => {
  describe('validateFlightSearch', () => {
    it('should validate correct flight search params', () => {
      const params = {
        origin: 'MOW',
        destination: 'LON',
        departDate: '2025-12-01',
        returnDate: '2025-12-10',
        adults: 2
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
        departDate: '2025-12-01'
      };

      const result = validateFlightSearch(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].field).toBe('origin');
    });

    it('should reject past dates', () => {
      const params = {
        origin: 'MOW',
        destination: 'LON',
        departDate: '2020-01-01'
      };

      const result = validateFlightSearch(params);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'departDate')).toBe(true);
    });

    it('should reject return date before departure', () => {
      const params = {
        origin: 'MOW',
        destination: 'LON',
        departDate: '2025-12-10',
        returnDate: '2025-12-01'
      };

      const result = validateFlightSearch(params);

      expect(result.isValid).toBe(false);
    });

    it('should apply default values', () => {
      const params = {
        origin: 'MOW',
        destination: 'LON',
        departDate: '2025-12-01'
      };

      const result = validateFlightSearch(params);

      expect(result.data.adults).toBe(1);
      expect(result.data.children).toBe(0);
      expect(result.data.cabinClass).toBe('economy');
    });
  });

  describe('validateHotelSearch', () => {
    it('should validate correct hotel search params', () => {
      const params = {
        destination: 'Paris',
        checkIn: '2025-12-01',
        checkOut: '2025-12-05',
        adults: 2,
        rooms: 1
      };

      const result = validateHotelSearch(params);

      expect(result.isValid).toBe(true);
      expect(result.data).toMatchObject(params);
    });

    it('should reject checkout before checkin', () => {
      const params = {
        destination: 'Paris',
        checkIn: '2025-12-05',
        checkOut: '2025-12-01'
      };

      const result = validateHotelSearch(params);

      expect(result.isValid).toBe(false);
    });
  });
});
