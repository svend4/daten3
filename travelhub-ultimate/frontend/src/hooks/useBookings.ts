import { useState } from 'react';

export const useBookings = () => {
  const [bookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    // TODO: Implement API call
    setLoading(false);
  };

  return { bookings, loading, fetchBookings };
};
