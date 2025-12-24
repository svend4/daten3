import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../utils/logger';
import type { FavoriteItem, Hotel, Flight } from '../types/api.types';

const FAVORITES_STORAGE_KEY = 'travelhub_favorites';

interface UseFavoritesReturn {
  favorites: FavoriteItem[];
  addHotelToFavorites: (hotel: Hotel) => void;
  addFlightToFavorites: (flight: Flight) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearAllFavorites: () => void;
  favoritesCount: number;
}

/**
 * Custom hook for managing user favorites with localStorage persistence.
 */
export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FavoriteItem[];
        setFavorites(parsed);
        logger.debug('Favorites loaded from storage', { count: parsed.length });
      }
    } catch (error) {
      logger.error('Failed to load favorites from storage', error);
      setFavorites([]);
    }
  }, []);

  // Persist favorites to localStorage
  const persistFavorites = useCallback((items: FavoriteItem[]): void => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      logger.error('Failed to save favorites to storage', error);
    }
  }, []);

  const addHotelToFavorites = useCallback((hotel: Hotel): void => {
    setFavorites((prev) => {
      // Check if already exists
      if (prev.some((f) => f.id === hotel.id)) {
        return prev;
      }

      const newFavorite: FavoriteItem = {
        id: hotel.id,
        type: 'hotel',
        addedAt: new Date().toISOString(),
        hotel,
        name: hotel.name,
        image: hotel.images[0],
        price: hotel.price,
        currency: hotel.currency,
        location: `${hotel.city}, ${hotel.country}`,
      };

      const updated = [...prev, newFavorite];
      persistFavorites(updated);
      logger.info('Hotel added to favorites', { hotelId: hotel.id });
      return updated;
    });
  }, [persistFavorites]);

  const addFlightToFavorites = useCallback((flight: Flight): void => {
    setFavorites((prev) => {
      // Check if already exists
      if (prev.some((f) => f.id === flight.id)) {
        return prev;
      }

      const newFavorite: FavoriteItem = {
        id: flight.id,
        type: 'flight',
        addedAt: new Date().toISOString(),
        flight,
        name: `${flight.origin} → ${flight.destination}`,
        image: flight.airlineLogo,
        price: flight.price,
        currency: flight.currency,
        location: flight.airline,
      };

      const updated = [...prev, newFavorite];
      persistFavorites(updated);
      logger.info('Flight added to favorites', { flightId: flight.id });
      return updated;
    });
  }, [persistFavorites]);

  const removeFavorite = useCallback((id: string): void => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      persistFavorites(updated);
      logger.info('Item removed from favorites', { id });
      return updated;
    });
  }, [persistFavorites]);

  const isFavorite = useCallback(
    (id: string): boolean => {
      return favorites.some((f) => f.id === id);
    },
    [favorites]
  );

  const clearAllFavorites = useCallback((): void => {
    setFavorites([]);
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    logger.info('All favorites cleared');
  }, []);

  const favoritesCount = useMemo(() => favorites.length, [favorites]);

  return {
    favorites,
    addHotelToFavorites,
    addFlightToFavorites,
    removeFavorite,
    isFavorite,
    clearAllFavorites,
    favoritesCount,
  };
};

export default useFavorites;
