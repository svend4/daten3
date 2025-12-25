import React, { useState, useEffect, useCallback, useMemo, memo, useId } from 'react';
import { Calendar, MapPin, CreditCard, X, CheckCircle, Clock, AlertCircle, Eye, Users, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { useAuth } from '../store/AuthContext';

interface Booking {
  id: string;
  userId: string;
  hotelId?: string;
  flightId?: string;
  type: 'HOTEL' | 'FLIGHT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  checkIn?: string;
  checkOut?: string;
  departureDate?: string;
  returnDate?: string;
  guests: number;
  totalPrice: number;
  currency: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  bookingReference?: string;
  createdAt: string;
  updatedAt: string;
}

type FilterType = 'ALL' | 'HOTEL' | 'FLIGHT';

/**
 * Get status text in Russian.
 */
function getStatusText(status: Booking['status']): string {
  switch (status) {
    case 'CONFIRMED':
      return 'Подтверждено';
    case 'PENDING':
      return 'Ожидает';
    case 'CANCELLED':
      return 'Отменено';
    default:
      return status;
  }
}

/**
 * Get payment status text in Russian.
 */
function getPaymentStatusText(status: Booking['paymentStatus']): string {
  switch (status) {
    case 'COMPLETED':
      return 'Оплачено';
    case 'PENDING':
      return 'Ожидает оплаты';
    case 'FAILED':
      return 'Ошибка оплаты';
    default:
      return status;
  }
}

/**
 * MyBookings page - displays user's travel bookings.
 */
const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Modal state for cancel confirmation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // Unique IDs for accessibility
  const headingId = useId();
  const errorId = useId();
  const filterGroupId = useId();
  const cancelModalId = useId();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchBookings();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{
        success: boolean;
        data: { bookings: Booking[] };
      }>('/bookings');

      if (response.success && response.data.bookings) {
        setBookings(response.data.bookings);
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to fetch bookings', err);
      setError(apiError.response?.data?.message || 'Не удалось загрузить бронирования');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenCancelModal = useCallback((bookingId: string) => {
    setCancelTargetId(bookingId);
    setShowCancelModal(true);
  }, []);

  const handleCloseCancelModal = useCallback(() => {
    setShowCancelModal(false);
    setCancelTargetId(null);
  }, []);

  const handleCancelBooking = useCallback(async () => {
    if (!cancelTargetId) return;

    try {
      setCancellingId(cancelTargetId);
      setShowCancelModal(false);

      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/bookings/${cancelTargetId}`);

      if (response.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === cancelTargetId
              ? { ...booking, status: 'CANCELLED' as const }
              : booking
          )
        );
        logger.info('Booking cancelled successfully');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to cancel booking', err);
      setError(apiError.response?.data?.message || 'Не удалось отменить бронирование');
    } finally {
      setCancellingId(null);
      setCancelTargetId(null);
    }
  }, [cancelTargetId]);

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleNavigateToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleViewDetails = useCallback((bookingId: string) => {
    navigate(`/bookings/${bookingId}`);
  }, [navigate]);

  // Memoized filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filter === 'ALL') return true;
      return booking.type === filter;
    });
  }, [bookings, filter]);

  // Memoized counts
  const counts = useMemo(() => ({
    all: bookings.length,
    hotels: bookings.filter((b) => b.type === 'HOTEL').length,
    flights: bookings.filter((b) => b.type === 'FLIGHT').length,
  }), [bookings]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Мои бронирования"
          aria-busy="true"
        >
          <Container>
            <div className="text-center py-12" role="status" aria-live="polite">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"
                aria-hidden="true"
              />
              <p className="mt-4 text-gray-600">Загрузка бронирований...</p>
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
                Для просмотра бронирований необходимо войти в аккаунт.
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
        aria-label="Мои бронирования"
      >
        <Container>
          {/* Header */}
          <header className="mb-8">
            <h1 id={headingId} className="text-3xl font-bold text-gray-900 mb-2">
              Мои бронирования
            </h1>
            <p className="text-gray-600">
              Просмотр и управление вашими бронированиями
            </p>
          </header>

          {/* Filters */}
          <nav
            className="mb-6"
            role="group"
            aria-labelledby={filterGroupId}
          >
            <span id={filterGroupId} className="sr-only">
              Фильтр по типу бронирования
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

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Бронирований нет
              </h2>
              <p className="text-gray-600 mb-6">
                {filter === 'ALL'
                  ? 'У вас пока нет бронирований.'
                  : filter === 'HOTEL'
                    ? 'У вас нет забронированных отелей.'
                    : 'У вас нет забронированных рейсов.'}
              </p>
              <Button onClick={handleNavigateToHome}>
                Найти путешествие
              </Button>
            </Card>
          ) : (
            <section aria-labelledby={headingId}>
              <ul className="space-y-4" role="list" aria-label="Список бронирований">
                {filteredBookings.map((booking) => (
                  <li key={booking.id}>
                    <BookingCard
                      booking={booking}
                      isCancelling={cancellingId === booking.id}
                      onCancel={handleOpenCancelModal}
                      onViewDetails={handleViewDetails}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Container>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={cancelModalId}
          >
            <Card className="max-w-md w-full p-6">
              <h3 id={cancelModalId} className="text-xl font-bold text-gray-900 mb-4">
                Отменить бронирование?
              </h3>
              <p className="text-gray-600 mb-6">
                Вы уверены, что хотите отменить это бронирование? Это действие нельзя отменить.
              </p>
              <div className="flex gap-3" role="group" aria-label="Действия диалога">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={handleCloseCancelModal}
                >
                  Назад
                </Button>
                <Button
                  fullWidth
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleCancelBooking}
                  icon={<X className="w-4 h-4" />}
                >
                  Отменить бронирование
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

interface BookingCardProps {
  booking: Booking;
  isCancelling: boolean;
  onCancel: (id: string) => void;
  onViewDetails: (id: string) => void;
}

/**
 * Individual booking card component.
 */
const BookingCard = memo(function BookingCard({
  booking,
  isCancelling,
  onCancel,
  onViewDetails,
}: BookingCardProps) {
  const handleCancelClick = useCallback(() => {
    onCancel(booking.id);
  }, [booking.id, onCancel]);

  const handleViewClick = useCallback(() => {
    onViewDetails(booking.id);
  }, [booking.id, onViewDetails]);

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" aria-hidden="true" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" aria-hidden="true" />;
      case 'CANCELLED':
        return <X className="w-4 h-4" aria-hidden="true" />;
      default:
        return <AlertCircle className="w-4 h-4" aria-hidden="true" />;
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const bookingLabel = booking.type === 'HOTEL'
    ? `Бронирование отеля ${booking.bookingReference || ''}`
    : `Бронирование рейса ${booking.bookingReference || ''}`;

  return (
    <Card
      className="p-6"
      aria-label={bookingLabel}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Booking Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}
            >
              <div className="flex items-center gap-1">
                {getStatusIcon(booking.status)}
                <span>{getStatusText(booking.status)}</span>
              </div>
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
              {booking.type === 'HOTEL' ? (
                <MapPin className="w-3 h-3" aria-hidden="true" />
              ) : (
                <Plane className="w-3 h-3" aria-hidden="true" />
              )}
              {booking.type === 'HOTEL' ? 'Отель' : 'Рейс'}
            </span>
          </div>

          {booking.bookingReference && (
            <p className="text-sm text-gray-600 mb-2">
              Номер брони: <span className="font-mono font-medium">{booking.bookingReference}</span>
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {booking.type === 'HOTEL' && (
              <>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm">
                    Заезд:{' '}
                    <time dateTime={booking.checkIn}>
                      {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('ru-RU') : 'Н/Д'}
                    </time>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm">
                    Выезд:{' '}
                    <time dateTime={booking.checkOut}>
                      {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('ru-RU') : 'Н/Д'}
                    </time>
                  </span>
                </div>
              </>
            )}

            {booking.type === 'FLIGHT' && (
              <>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm">
                    Вылет:{' '}
                    <time dateTime={booking.departureDate}>
                      {booking.departureDate ? new Date(booking.departureDate).toLocaleDateString('ru-RU') : 'Н/Д'}
                    </time>
                  </span>
                </div>
                {booking.returnDate && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm">
                      Возврат:{' '}
                      <time dateTime={booking.returnDate}>
                        {new Date(booking.returnDate).toLocaleDateString('ru-RU')}
                      </time>
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Гостей: {booking.guests}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <CreditCard className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">
                Оплата: {getPaymentStatusText(booking.paymentStatus)}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-3">
            <time dateTime={booking.createdAt}>
              Забронировано {new Date(booking.createdAt).toLocaleString('ru-RU')}
            </time>
          </p>
        </div>

        {/* Price & Actions */}
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">
              {booking.totalPrice.toLocaleString('ru-RU')} {booking.currency}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewClick}
              icon={<Eye className="w-4 h-4" />}
            >
              Подробнее
            </Button>

            {booking.status === 'CONFIRMED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelClick}
                loading={isCancelling}
                className="text-red-600 border-red-600 hover:bg-red-50"
                aria-label={`Отменить бронирование ${booking.bookingReference || booking.id}`}
              >
                Отменить
              </Button>
            )}

            {booking.status === 'PENDING' && (
              <div className="text-sm text-yellow-600 font-medium text-center" role="status">
                Ожидает подтверждения
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

export default memo(MyBookings);
