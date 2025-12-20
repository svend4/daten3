import { useState } from 'react';
import { api } from '../utils/api';

export const useHotelSearch = () => {
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchHotels = async (params: any) => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await api.post('/hotels/search', params);
      setHotels(data.hotels || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search hotels');
    } finally {
      setLoading(false);
    }
  };

  return { hotels, loading, error, searchHotels };
};
