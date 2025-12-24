import { useEffect, useState, useCallback, memo, useId } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plane, Clock, AlertCircle, Search, ArrowRight, Luggage } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useFlightSearch } from '../hooks/useFlightSearch';
import Loading from '../components/common/Loading';
import type { FlightSearchResult } from '../types/api.types';

/**
 * Flight search results page with accessibility support.
 */
function FlightSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { flights, loading, error, searchFlights } = useFlightSearch();
  const [searched, setSearched] = useState(false);

  // Unique IDs for accessibility
  const resultsHeadingId = useId();
  const errorId = useId();

  // Handle search from navigation state
  useEffect(() => {
    const params = location.state?.searchParams;
    if (params && !searched) {
      searchFlights(params);
      setSearched(true);
    }
  }, [location.state, searched, searchFlights]);

  // Navigate to booking
  const handleFlightClick = useCallback((flightId: string) => {
    navigate(`/booking/flight/${flightId}`);
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
        aria-label="Результаты поиска авиабилетов"
        aria-busy={loading}
      >
        <Container>
          <header className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Поиск авиабилетов
            </h1>
            {searched && !loading && flights.length > 0 && (
              <p className="text-gray-600 mt-2">
                Найдено {flights.length} {getFlightCountText(flights.length)}
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
          {!loading && !error && flights.length === 0 && searched && (
            <Card className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Рейсы не найдены
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
          {!loading && !error && flights.length > 0 && (
            <section aria-labelledby={resultsHeadingId}>
              <h2 id={resultsHeadingId} className="sr-only">
                Список найденных рейсов
              </h2>
              <ul className="grid gap-6" role="list" aria-label="Результаты поиска авиабилетов">
                {flights.map((flight: FlightSearchResult) => (
                  <li key={flight.id}>
                    <FlightCard flight={flight} onClick={() => handleFlightClick(flight.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Initial State - No Search Yet */}
          {!searched && (
            <Card className="text-center py-12">
              <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Начните поиск
              </h2>
              <p className="text-gray-600 mb-6">
                Используйте форму поиска на главной странице для поиска авиабилетов.
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

interface FlightCardProps {
  flight: FlightSearchResult;
  onClick: () => void;
}

/**
 * Individual flight card component.
 */
const FlightCard = memo(function FlightCard({ flight, onClick }: FlightCardProps) {
  const departureTime = new Date(flight.departureTime);
  const arrivalTime = new Date(flight.arrivalTime);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const classLabels: Record<string, string> = {
    economy: 'Эконом',
    business: 'Бизнес',
    first: 'Первый класс',
  };

  return (
    <Card
      hover
      className="overflow-hidden"
      onClick={onClick}
      aria-label={`${flight.airline} ${flight.flightNumber}, ${flight.origin} — ${flight.destination}, ${flight.price} ${flight.currency}`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Airline Info */}
        <div className="flex items-center gap-3 md:w-40">
          {flight.airlineLogo ? (
            <img
              src={flight.airlineLogo}
              alt={`Логотип ${flight.airline}`}
              className="w-10 h-10 object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary-600" aria-hidden="true" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{flight.airline}</p>
            <p className="text-sm text-gray-500">{flight.flightNumber}</p>
          </div>
        </div>

        {/* Flight Times */}
        <div className="flex-grow">
          <div className="flex items-center gap-4">
            {/* Departure */}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatTime(departureTime)}</p>
              <p className="text-sm text-gray-600">{flight.originCity || flight.origin}</p>
            </div>

            {/* Route Line */}
            <div className="flex-grow flex items-center gap-2">
              <div className="flex-grow border-t border-gray-300 border-dashed" />
              <div className="flex flex-col items-center">
                <ArrowRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <span className="text-xs text-gray-500">
                  {formatDuration(flight.duration)}
                </span>
                {flight.stops > 0 && (
                  <span className="text-xs text-orange-600">
                    {flight.stops} {getStopsText(flight.stops)}
                  </span>
                )}
              </div>
              <div className="flex-grow border-t border-gray-300 border-dashed" />
            </div>

            {/* Arrival */}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatTime(arrivalTime)}</p>
              <p className="text-sm text-gray-600">{flight.destinationCity || flight.destination}</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded">
              {classLabels[flight.class] || flight.class}
            </span>
            {flight.baggage && (
              <span className="flex items-center gap-1">
                <Luggage className="w-4 h-4" aria-hidden="true" />
                {flight.baggage}
              </span>
            )}
            {flight.stops === 0 && (
              <span className="text-green-600 font-medium">Прямой рейс</span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="md:w-40 text-right">
          <p className="text-2xl font-bold text-primary-600">
            {flight.price.toLocaleString('ru-RU')}
          </p>
          <p className="text-sm text-gray-600">{flight.currency}</p>
          <Button size="sm" className="mt-2">
            Выбрать
          </Button>
        </div>
      </div>

      {/* Return Flight (if exists) */}
      {flight.returnFlight && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Обратный рейс</p>
          <ReturnFlightInfo flight={flight.returnFlight} />
        </div>
      )}
    </Card>
  );
});

interface ReturnFlightInfoProps {
  flight: FlightSearchResult['returnFlight'];
}

const ReturnFlightInfo = memo(function ReturnFlightInfo({ flight }: ReturnFlightInfoProps) {
  if (!flight) return null;

  const departureTime = new Date(flight.departureTime);
  const arrivalTime = new Date(flight.arrivalTime);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="font-medium">{flight.airline}</span>
      <span>
        {formatTime(departureTime)} — {formatTime(arrivalTime)}
      </span>
      <span className="text-gray-500">
        {flight.origin} → {flight.destination}
      </span>
    </div>
  );
});

/**
 * Get proper Russian plural form for flight count.
 */
function getFlightCountText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'рейсов';
  if (lastOne === 1) return 'рейс';
  if (lastOne >= 2 && lastOne <= 4) return 'рейса';
  return 'рейсов';
}

/**
 * Get proper Russian plural form for stops count.
 */
function getStopsText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'пересадок';
  if (lastOne === 1) return 'пересадка';
  if (lastOne >= 2 && lastOne <= 4) return 'пересадки';
  return 'пересадок';
}

export default memo(FlightSearch);
