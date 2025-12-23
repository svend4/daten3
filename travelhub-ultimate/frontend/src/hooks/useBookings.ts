import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

export const useBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/bookings');

      if (response.data && response.data.bookings) {
        setBookings(response.data.bookings);
        logger.info('Bookings fetched successfully', { count: response.data.bookings.length });
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch bookings';
      setError(errorMessage);
      logger.error('Failed to fetch bookings', { error: errorMessage });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      logger.info('Booking cancelled', { bookingId });

      // Refresh bookings list
      await fetchBookings();

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to cancel booking';
      logger.error('Failed to cancel booking', { bookingId, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Auto-fetch bookings on mount
  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    cancelBooking
  };
};
