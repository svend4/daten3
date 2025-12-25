import React, { useState, useEffect, useCallback, useMemo, memo, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, AlertCircle, Trash2, Plane } from 'lucide-react';
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

type FilterType = 'ALL' | 'HOTEL' | 'FLIGHT';

/**
 * Favorites page - displays user's saved hotels and flights.
 */
const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('ALL');

  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Unique IDs for accessibility
  const headingId = useId();
  const errorId = useId();
  const filterGroupId = useId();
  const deleteModalId = useId();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchFavorites();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchFavorites = useCallback(async () => {
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
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to fetch favorites', err);
      setError(apiError.response?.data?.message || 'Не удалось загрузить избранное');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenDeleteModal = useCallback((favoriteId: string) => {
    setDeleteTargetId(favoriteId);
    setShowDeleteModal(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  }, []);

  const handleRemoveFavorite = useCallback(async () => {
    if (!deleteTargetId) return;

    try {
      setRemovingId(deleteTargetId);
      setShowDeleteModal(false);

      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/favorites/${deleteTargetId}`);

      if (response.success) {
        setFavorites((prev) => prev.filter((fav) => fav.id !== deleteTargetId));
        logger.info('Favorite removed successfully');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to remove favorite', err);
      setError(apiError.response?.data?.message || 'Не удалось удалить из избранного');
    } finally {
      setRemovingId(null);
      setDeleteTargetId(null);
    }
  }, [deleteTargetId]);

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleNavigateToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleViewDetails = useCallback((itemType: string, itemId: string) => {
    navigate(`/${itemType.toLowerCase()}s/${itemId}`);
  }, [navigate]);

  // Memoized filtered favorites
  const filteredFavorites = useMemo(() => {
    return favorites.filter((favorite) => {
      if (filter === 'ALL') return true;
      return favorite.itemType === filter;
    });
  }, [favorites, filter]);

  // Memoized counts
  const counts = useMemo(() => ({
    all: favorites.length,
    hotels: favorites.filter((f) => f.itemType === 'HOTEL').length,
    flights: favorites.filter((f) => f.itemType === 'FLIGHT').length,
  }), [favorites]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Избранное"
          aria-busy="true"
        >
          <Container>
            <div className="text-center py-12" role="status" aria-live="polite">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"
                aria-hidden="true"
              />
              <p className="mt-4 text-gray-600">Загрузка избранного...</p>
              <span className="sr-only">Пожалуйста, подождите</span>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Authentication guard
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Требуется авторизация"
        >
          <Container>
            <Card className="p-12 text-center" role="alert">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Требуется вход
              </h1>
              <p className="text-gray-600 mb-6">
                Для просмотра избранного необходимо войти в аккаунт.
              </p>
              <Button onClick={handleNavigateToLogin}>
                Перейти к входу
              </Button>
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
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Избранное"
      >
        <Container>
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" aria-hidden="true" />
              <h1 id={headingId} className="text-3xl font-bold text-gray-900">
                Избранное
              </h1>
            </div>
            <p className="text-gray-600">
              Сохранённые отели и рейсы ({favorites.length} {getItemCountText(favorites.length)})
            </p>
          </header>

          {/* Filters */}
          <nav
            className="mb-6"
            role="group"
            aria-labelledby={filterGroupId}
          >
            <span id={filterGroupId} className="sr-only">
              Фильтр по типу
            </span>
            <div className="flex gap-4">
              <button
                onClick={() => handleFilterChange('ALL')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  filter === 'ALL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                aria-pressed={filter === 'ALL'}
              >
                Все ({counts.all})
              </button>
              <button
                onClick={() => handleFilterChange('HOTEL')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  filter === 'HOTEL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                aria-pressed={filter === 'HOTEL'}
              >
                Отели ({counts.hotels})
              </button>
              <button
                onClick={() => handleFilterChange('FLIGHT')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  filter === 'FLIGHT'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                aria-pressed={filter === 'FLIGHT'}
              >
                Рейсы ({counts.flights})
              </button>
            </div>
          </nav>

          {/* Error Message */}
          {error && (
            <Card
              className="p-4 mb-6 bg-red-50 border-red-200"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
                <span id={errorId}>{error}</span>
              </div>
            </Card>
          )}

          {/* Favorites Grid */}
          {filteredFavorites.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Пока ничего нет
              </h2>
              <p className="text-gray-600 mb-6">
                {filter === 'ALL'
                  ? 'Начните добавлять отели и рейсы в избранное!'
                  : filter === 'HOTEL'
                    ? 'У вас нет сохранённых отелей.'
                    : 'У вас нет сохранённых рейсов.'}
              </p>
              <Button onClick={handleNavigateToHome}>
                Найти путешествие
              </Button>
            </Card>
          ) : (
            <section aria-labelledby={headingId}>
              <ul
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                role="list"
                aria-label="Список избранного"
              >
                {filteredFavorites.map((favorite) => (
                  <li key={favorite.id}>
                    <FavoriteCard
                      favorite={favorite}
                      isRemoving={removingId === favorite.id}
                      onRemove={handleOpenDeleteModal}
                      onViewDetails={handleViewDetails}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Container>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteModalId}
          >
            <Card className="max-w-md w-full p-6">
              <h3 id={deleteModalId} className="text-xl font-bold text-gray-900 mb-4">
                Удалить из избранного?
              </h3>
              <p className="text-gray-600 mb-6">
                Вы уверены, что хотите удалить этот элемент из избранного?
              </p>
              <div className="flex gap-3" role="group" aria-label="Действия диалога">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={handleCloseDeleteModal}
                >
                  Отмена
                </Button>
                <Button
                  fullWidth
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleRemoveFavorite}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Удалить
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

interface FavoriteCardProps {
  favorite: Favorite;
  isRemoving: boolean;
  onRemove: (id: string) => void;
  onViewDetails: (itemType: string, itemId: string) => void;
}

/**
 * Individual favorite card component.
 */
const FavoriteCard = memo(function FavoriteCard({
  favorite,
  isRemoving,
  onRemove,
  onViewDetails,
}: FavoriteCardProps) {
  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(favorite.id);
  }, [favorite.id, onRemove]);

  const handleViewClick = useCallback(() => {
    onViewDetails(favorite.itemType, favorite.itemId);
  }, [favorite.itemType, favorite.itemId, onViewDetails]);

  const itemName = favorite.itemData?.name ||
    `${favorite.itemType === 'HOTEL' ? 'Отель' : 'Рейс'} #${favorite.itemId.substring(0, 8)}`;

  return (
    <Card
      className="overflow-hidden"
      aria-label={`${itemName}${favorite.itemData?.location ? `, ${favorite.itemData.location}` : ''}`}
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
        {favorite.itemData?.image ? (
          <img
            src={favorite.itemData.image}
            alt={`Фото: ${itemName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {favorite.itemType === 'HOTEL' ? (
              <MapPin className="w-16 h-16 text-white/50" aria-hidden="true" />
            ) : (
              <Plane className="w-16 h-16 text-white/50" aria-hidden="true" />
            )}
          </div>
        )}

        {/* Remove Button */}
        <button
          onClick={handleRemoveClick}
          disabled={isRemoving}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label={`Удалить ${itemName} из избранного`}
        >
          {isRemoving ? (
            <div
              className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Trash2 className="w-5 h-5 text-red-500" aria-hidden="true" />
          )}
        </button>

        {/* Type Badge */}
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-900">
            {favorite.itemType === 'HOTEL' ? 'Отель' : 'Рейс'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {itemName}
        </h3>

        {favorite.itemData?.location && (
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">{favorite.itemData.location}</span>
          </div>
        )}

        {favorite.itemData?.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              <span className="font-semibold text-gray-900">
                {favorite.itemData.rating.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          {favorite.itemData?.price ? (
            <div className="text-xl font-bold text-primary-600">
              {favorite.itemData.price.toLocaleString('ru-RU')} {favorite.itemData.currency || '₽'}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Цена недоступна
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleViewClick}
          >
            Подробнее
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          <time dateTime={favorite.createdAt}>
            Добавлено {new Date(favorite.createdAt).toLocaleDateString('ru-RU')}
          </time>
        </p>
      </div>
    </Card>
  );
});

/**
 * Get proper Russian plural form for item count.
 */
function getItemCountText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'элементов';
  if (lastOne === 1) return 'элемент';
  if (lastOne >= 2 && lastOne <= 4) return 'элемента';
  return 'элементов';
}

export default memo(Favorites);
