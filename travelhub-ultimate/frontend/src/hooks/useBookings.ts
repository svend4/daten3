import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import type { Booking, ApiResponse, ApiError } from '../types/api.types';

interface BookingsResponse {
  bookings: Booking[];
  total?: number;
}

interface CancelBookingResult {
  success: boolean;
  error?: string;
}

interface UseBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  fetchBookings: () => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<CancelBookingResult>;
  getBookingById: (id: string) => Booking | undefined;
}

/**
 * Custom hook for managing user bookings with proper typing.
 */
export const useBookings = (): UseBookingsReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<ApiResponse<BookingsResponse>>('/bookings');

      if (response.success && response.data?.bookings) {
        setBookings(response.data.bookings);
        logger.info('Bookings fetched successfully', {
          count: response.data.bookings.length,
        });
      } else {
        setBookings([]);
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Не удалось загрузить бронирования';
      setError(errorMessage);
      logger.error('Failed to fetch bookings', apiError);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(
    async (bookingId: string): Promise<CancelBookingResult> => {
      try {
        await api.post<ApiResponse<void>>(`/bookings/${bookingId}/cancel`);
        logger.info('Booking cancelled', { bookingId });

        // Update local state optimistically
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'cancelled' as const }
              : booking
          )
        );

        return { success: true };
      } catch (err: unknown) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Не удалось отменить бронирование';
        logger.error('Failed to cancel booking', { bookingId, error: apiError });
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const getBookingById = useCallback(
    (id: string): Booking | undefined => {
      return bookings.find((booking) => booking.id === id);
    },
    [bookings]
  );

  // Auto-fetch bookings on mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    cancelBooking,
    getBookingById,
  };
};

export default useBookings;
