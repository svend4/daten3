import { useState, useCallback } from 'react';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import type {
  HotelSearchResult,
  HotelSearchParams,
  ApiResponse,
  ApiError,
} from '../types/api.types';

interface HotelSearchResponse {
  hotels: HotelSearchResult[];
  total: number;
}

interface UseHotelSearchReturn {
  hotels: HotelSearchResult[];
  loading: boolean;
  error: string | null;
  searchHotels: (params: HotelSearchParams) => Promise<void>;
  clearResults: () => void;
}

/**
 * Custom hook for searching hotels with proper typing and error handling.
 */
export const useHotelSearch = (): UseHotelSearchReturn => {
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<HotelSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchHotels = useCallback(async (params: HotelSearchParams): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('Searching hotels', params);

      const response = await api.post<ApiResponse<HotelSearchResponse>>(
        '/hotels/search',
        params
      );

      if (response.success && response.data) {
        setHotels(response.data.hotels || []);
        logger.info('Hotel search completed', {
          count: response.data.hotels?.length || 0,
        });
      } else {
        setHotels([]);
        setError(response.message || 'Не удалось найти отели');
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Ошибка при поиске отелей';
      setError(errorMessage);
      setHotels([]);
      logger.error('Hotel search failed', apiError);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback((): void => {
    setHotels([]);
    setError(null);
  }, []);

  return {
    hotels,
    loading,
    error,
    searchHotels,
    clearResults,
  };
};

export default useHotelSearch;
