import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface Favorite {
  id: string;
  type: string;
  itemId: string;
  itemData: any;
  createdAt: string;
}

export function useFavorites(type?: string) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/favorites`, {
        params: { type },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFavorites(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (type: string, itemId: string, itemData: any) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please login to add favorites');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/favorites`,
        { type, itemId, itemData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setFavorites([response.data.data, ...favorites]);
        toast.success('Added to favorites');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add favorite');
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await axios.delete(`${API_BASE_URL}/favorites/${favoriteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFavorites(favorites.filter(f => f.id !== favoriteId));
        toast.success('Removed from favorites');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove favorite');
    }
  };

  const isFavorited = useCallback((itemId: string) => {
    return favorites.some(f => f.itemId === itemId);
  }, [favorites]);

  const getFavoriteId = useCallback((itemId: string) => {
    return favorites.find(f => f.itemId === itemId)?.id;
  }, [favorites]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorited,
    getFavoriteId,
    refetch: fetchFavorites,
  };
}
