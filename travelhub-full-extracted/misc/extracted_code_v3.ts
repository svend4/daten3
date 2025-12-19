import { useState, useCallback } from 'react';
import travelHubService from '@services/api/travelhub.service';
import { Flight, FlightSearchParams } from '@types/api.types';

interface UseFlightSearchResult {
  flights: Flight[];
  loading: boolean;
  error: string | null;
  search: (params: FlightSearchParams) => Promise<void>;
  reset: () => void;
  hasSearched: boolean;
}

export function useFlightSearch(): UseFlightSearchResult {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (params: FlightSearchParams) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await travelHubService.searchFlights(params);
      setFlights(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFlights([]);
    setError(null);
    setLoading(false);
    setHasSearched(false);
  }, []);

  return { flights, loading, error, search, reset, hasSearched };
}
