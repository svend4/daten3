import { useState } from 'react';
import { api } from '../utils/api';

export const useFlightSearch = () => {
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = async (params: any) => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await api.post('/flights/search', params);
      setFlights(data.flights || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  };

  return { flights, loading, error, searchFlights };
};
