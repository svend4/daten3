import { useState, useCallback } from 'react';
import travelHubService from '@services/api/travelhub.service';
import { Hotel, HotelSearchParams } from '@types/api.types';

interface UseHotelSearchResult {
  hotels: Hotel[];
  loading: boolean;
  error: string | null;
  search: (params: HotelSearchParams) => Promise<void>;
  reset: () => void;
  hasSearched: boolean;
}

export function useHotelSearch(): UseHotelSearchResult {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (params: HotelSearchParams) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await travelHubService.searchHotels(params);
      setHotels(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHotels([]);
    setError(null);
    setLoading(false);
    setHasSearched(false);
  }, []);

  return { hotels, loading, error, search, reset, hasSearched };
}
