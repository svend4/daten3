// src/hooks/useFlightSearch.ts
import { useState, useCallback } from 'react';
import travelHubService, { Flight, FlightSearchParams } from '../services/api/travelhub.service';

interface UseFlightSearchResult {
  flights: Flight[];
  loading: boolean;
  error: string | null;
  search: (params: FlightSearchParams) => Promise<void>;
  reset: () => void;
}

export function useFlightSearch(): UseFlightSearchResult {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: FlightSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const results = await travelHubService.searchFlights(params);
      setFlights(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFlights([]);
    setError(null);
    setLoading(false);
  }, []);

  return { flights, loading, error, search, reset };
}
