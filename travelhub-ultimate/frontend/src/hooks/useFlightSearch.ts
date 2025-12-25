import { useState, useCallback } from 'react';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import type {
  FlightSearchResult,
  FlightSearchParams,
  ApiResponse,
  ApiError,
} from '../types/api.types';

interface FlightSearchResponse {
  flights: FlightSearchResult[];
  total: number;
}

interface UseFlightSearchReturn {
  flights: FlightSearchResult[];
  loading: boolean;
  error: string | null;
  searchFlights: (params: FlightSearchParams) => Promise<void>;
  clearResults: () => void;
}

/**
 * Custom hook for searching flights with proper typing and error handling.
 */
export const useFlightSearch = (): UseFlightSearchReturn => {
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<FlightSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = useCallback(async (params: FlightSearchParams): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('Searching flights', params);

      const response = await api.post<ApiResponse<FlightSearchResponse>>(
        '/flights/search',
        params
      );

      if (response.success && response.data) {
        setFlights(response.data.flights || []);
        logger.info('Flight search completed', {
          count: response.data.flights?.length || 0,
        });
      } else {
        setFlights([]);
        setError(response.message || 'Не удалось найти рейсы');
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Ошибка при поиске рейсов';
      setError(errorMessage);
      setFlights([]);
      logger.error('Flight search failed', apiError);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback((): void => {
    setFlights([]);
    setError(null);
  }, []);

  return {
    flights,
    loading,
    error,
    searchFlights,
    clearResults,
  };
};

export default useFlightSearch;
