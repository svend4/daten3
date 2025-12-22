import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Star, AlertCircle, Trash2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { useAuth } from '../store/AuthContext';

interface Favorite {
  id: string;
  userId: string;
  itemType: 'HOTEL' | 'FLIGHT';
  itemId: string;
  itemData?: {
    name?: string;
    location?: string;
    rating?: number;
    price?: number;
    currency?: string;
    image?: string;
  };
  createdAt: string;
}

const Favorites: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'HOTEL' | 'FLIGHT'>('ALL');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchFavorites();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{
        success: boolean;
        data: { favorites: Favorite[] };
      }>('/favorites');

      if (response.success && response.data.favorites) {
        setFavorites(response.data.favorites);
      }
    } catch (err: any) {
      logger.error('Failed to fetch favorites', err);
      setError(err.response?.data?.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    if (!confirm('Remove this item from favorites?')) {
      return;
    }

    try {
      setRemovingId(favoriteId);

      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/favorites/${favoriteId}`);

      if (response.success) {
        // Update local state
        setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
        logger.info('Favorite removed successfully');
      }
    } catch (err: any) {
      logger.error('Failed to remove favorite', err);
      alert(err.response?.data?.message || 'Failed to remove favorite');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredFavorites = favorites.filter((favorite) => {
    if (filter === 'ALL') return true;
    return favorite.itemType === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your favorites...</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Please Log In
              </h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to view your favorites.
              </p>
              <Button href="/login">Go to Login</Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                My Favorites
              </h1>
            </div>
            <p className="text-gray-600">
              Hotels and flights you've saved ({favorites.length} items)
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({favorites.length})
            </button>
            <button
              onClick={() => setFilter('HOTEL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'HOTEL'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Hotels ({favorites.filter((f) => f.itemType === 'HOTEL').length})
            </button>
            <button
              onClick={() => setFilter('FLIGHT')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'FLIGHT'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Flights ({favorites.filter((f) => f.itemType === 'FLIGHT').length})
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Favorites Grid */}
          {filteredFavorites.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No favorites yet
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'ALL'
                  ? "Start adding hotels and flights to your favorites!"
                  : `You have no ${filter.toLowerCase()} favorites.`}
              </p>
              <Button href="/">Explore Travel Options</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((favorite) => (
                <Card key={favorite.id} className="overflow-hidden group">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
                    {favorite.itemData?.image && (
                      <img
                        src={favorite.itemData.image}
                        alt={favorite.itemData.name || 'Favorite'}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      disabled={removingId === favorite.id}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      {removingId === favorite.id ? (
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5 text-red-500" />
                      )}
                    </button>

                    {/* Type Badge */}
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-900">
                        {favorite.itemType}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {favorite.itemData?.name || `${favorite.itemType} #${favorite.itemId.substring(0, 8)}`}
                    </h3>

                    {favorite.itemData?.location && (
                      <div className="flex items-center gap-2 text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{favorite.itemData.location}</span>
                      </div>
                    )}

                    {favorite.itemData?.rating && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-900">
                            {favorite.itemData.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      {favorite.itemData?.price ? (
                        <div className="text-xl font-bold text-primary-600">
                          {favorite.itemData.currency || '$'}
                          {favorite.itemData.price.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Price not available
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        href={`/${favorite.itemType.toLowerCase()}/${favorite.itemId}`}
                      >
                        View Details
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Added {new Date(favorite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
