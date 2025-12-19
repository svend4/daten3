import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface Booking {
  id: string;
  type: string;
  itemData: any;
  status: string;
  totalPrice: number;
  currency: string;
  bookingDate: string;
  travelDate: string;
}

export function useBookings(type?: string, status?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        params: { type, status },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [type, status]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await axios.delete(`${API_BASE_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBookings(bookings.map(b => 
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  return {
    bookings,
    loading,
    error,
    cancelBooking,
    refetch: fetchBookings,
  };
}
