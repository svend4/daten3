const request = require('supertest');
const app = require('../../src/app');

describe('Flights API', () => {
  describe('GET /api/flights/search', () => {
    it('should search flights successfully', async () => {
      const response = await request(app)
        .get('/api/flights/search')
        .query({
          origin: 'MOW',
          destination: 'LON',
          departDate: '2025-12-01',
          returnDate: '2025-12-10',
          adults: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    it('should return 400 for invalid params', async () => {
      const response = await request(app)
        .get('/api/flights/search')
        .query({
          origin: 'INVALID',
          destination: 'LON',
          departDate: '2025-12-01'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing required params', async () => {
      const response = await request(app)
        .get('/api/flights/search')
        .query({
          origin: 'MOW'
          // Missing destination and departDate
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should respect rate limiting', async () => {
      // Make 11 requests (limit is 10 per minute)
      const requests = Array(11).fill(null).map(() =>
        request(app)
          .get('/api/flights/search')
          .query({
            origin: 'MOW',
            destination: 'LON',
            departDate: '2025-12-01'
          })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/flights/:id', () => {
    it('should return flight details', async () => {
      const response = await request(app)
        .get('/api/flights/MOW-LON-2025-12-01')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
