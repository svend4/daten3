import { useEffect, useState, useCallback, memo, useId } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Star, AlertCircle, Search } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useHotelSearch } from '../hooks/useHotelSearch';
import Loading from '../components/common/Loading';
import type { HotelSearchResult } from '../types/api.types';

/**
 * Hotel search results page with accessibility support.
 */
function HotelSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hotels, loading, error, searchHotels } = useHotelSearch();
  const [searched, setSearched] = useState(false);

  // Unique IDs for accessibility
  const resultsHeadingId = useId();
  const errorId = useId();

  // Handle search from navigation state
  useEffect(() => {
    const params = location.state?.searchParams;
    if (params && !searched) {
      searchHotels(params);
      setSearched(true);
    }
  }, [location.state, searched, searchHotels]);

  // Navigate to hotel details
  const handleHotelClick = useCallback((hotelId: string) => {
    navigate(`/hotels/${hotelId}`);
  }, [navigate]);

  // Navigate to home for new search
  const handleNewSearch = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-8"
        role="main"
        aria-label="Результаты поиска отелей"
        aria-busy={loading}
      >
        <Container>
          <header className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Поиск отелей
            </h1>
            {searched && !loading && hotels.length > 0 && (
              <p className="text-gray-600 mt-2">
                Найдено {hotels.length} {getHotelCountText(hotels.length)}
              </p>
            )}
          </header>

          {/* Loading State */}
          {loading && (
            <div role="status" aria-live="polite" className="text-center py-12">
              <Loading />
              <span className="sr-only">Загрузка результатов поиска...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card
              className="bg-red-50 border-red-200 mb-6"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span id={errorId}>Ошибка: {error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleNewSearch}
              >
                Попробовать снова
              </Button>
            </Card>
          )}

          {/* Empty Results */}
          {!loading && !error && hotels.length === 0 && searched && (
            <Card className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Отели не найдены
              </h2>
              <p className="text-gray-600 mb-6">
                По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.
              </p>
              <Button onClick={handleNewSearch}>
                Новый поиск
              </Button>
            </Card>
          )}

          {/* Search Results */}
          {!loading && !error && hotels.length > 0 && (
            <section aria-labelledby={resultsHeadingId}>
              <h2 id={resultsHeadingId} className="sr-only">
                Список найденных отелей
              </h2>
              <ul className="grid gap-6" role="list" aria-label="Результаты поиска отелей">
                {hotels.map((hotel: HotelSearchResult) => (
                  <li key={hotel.id}>
                    <HotelCard hotel={hotel} onClick={() => handleHotelClick(hotel.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Initial State - No Search Yet */}
          {!searched && (
            <Card className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Начните поиск
              </h2>
              <p className="text-gray-600 mb-6">
                Используйте форму поиска на главной странице для поиска отелей.
              </p>
              <Button onClick={handleNewSearch}>
                Перейти к поиску
              </Button>
            </Card>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}

interface HotelCardProps {
  hotel: HotelSearchResult;
  onClick: () => void;
}

/**
 * Individual hotel card component.
 */
const HotelCard = memo(function HotelCard({ hotel, onClick }: HotelCardProps) {
  return (
    <Card
      hover
      className="overflow-hidden"
      onClick={onClick}
      aria-label={`${hotel.name}, ${hotel.location}, ${hotel.pricePerNight} ${hotel.currency} за ночь, рейтинг ${hotel.rating}`}
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Hotel Image */}
        {hotel.imageUrl && (
          <div className="md:w-48 md:h-36 flex-shrink-0">
            <img
              src={hotel.imageUrl}
              alt={`Фото отеля ${hotel.name}`}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        )}

        {/* Hotel Info */}
        <div className="flex-grow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
              <div className="flex items-center gap-1 text-gray-600 mt-1">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span>{hotel.location}</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 bg-primary-100 px-2 py-1 rounded">
              <Star className="w-4 h-4 text-primary-600" aria-hidden="true" />
              <span className="font-semibold text-primary-600">{hotel.rating}</span>
            </div>
          </div>

          {/* Stars */}
          {hotel.stars && (
            <div className="flex items-center gap-1 mt-2" aria-label={`${hotel.stars} звёзд`}>
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-yellow-400 fill-yellow-400"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {hotel.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                >
                  {amenity}
                </span>
              ))}
              {hotel.amenities.length > 4 && (
                <span className="px-2 py-1 text-gray-500 text-sm">
                  +{hotel.amenities.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="text-2xl font-bold text-primary-600">
                {hotel.pricePerNight.toLocaleString('ru-RU')}
              </span>
              <span className="text-gray-600 ml-1">{hotel.currency} / ночь</span>
            </div>
            {hotel.availableRooms && hotel.availableRooms <= 5 && (
              <span className="text-orange-600 text-sm font-medium">
                Осталось {hotel.availableRooms} {getRoomCountText(hotel.availableRooms)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

/**
 * Get proper Russian plural form for hotel count.
 */
function getHotelCountText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'отелей';
  if (lastOne === 1) return 'отель';
  if (lastOne >= 2 && lastOne <= 4) return 'отеля';
  return 'отелей';
}

/**
 * Get proper Russian plural form for room count.
 */
function getRoomCountText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'номеров';
  if (lastOne === 1) return 'номер';
  if (lastOne >= 2 && lastOne <= 4) return 'номера';
  return 'номеров';
}

export default memo(HotelSearch);
