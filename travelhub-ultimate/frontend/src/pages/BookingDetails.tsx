import React, { useState, useEffect, useCallback, memo, useId } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CreditCard,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Hotel as HotelIcon,
  Plane,
  ArrowLeft,
  Download,
  Mail,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface Booking {
  id: string;
  type: 'HOTEL' | 'FLIGHT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookingReference: string;
  itemId: string;
  itemDetails?: {
    name?: string;
    location?: string;
    imageUrl?: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Booking details page - displays full booking info and actions.
 */
const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [success, setSuccess] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Unique IDs for accessibility
  const headingId = useId();
  const errorId = useId();
  const successId = useId();
  const modalTitleId = useId();

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{
        success: boolean;
        data: { booking: Booking };
      }>(`/bookings/${id}`);

      if (response.success && response.data.booking) {
        setBooking(response.data.booking);
        logger.info('Booking details loaded', { bookingId: id });
      } else {
        setError('Бронирование не найдено');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to fetch booking details', err);
      setError(apiError.response?.data?.message || 'Не удалось загрузить детали бронирования');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      fetchBookingDetails();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, id, fetchBookingDetails]);

  const handleOpenCancelModal = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const handleCloseCancelModal = useCallback(() => {
    setShowCancelModal(false);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!booking) return;

    setCancelling(true);
    setError('');
    setSuccess('');
    setShowCancelModal(false);

    try {
      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/bookings/${booking.id}`);

      if (response.success) {
        setSuccess('Бронирование успешно отменено');
        await fetchBookingDetails();
        logger.info('Booking cancelled', { bookingId: booking.id });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Не удалось отменить бронирование');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to cancel booking', err);
      setError(apiError.response?.data?.message || 'Не удалось отменить бронирование');
    } finally {
      setCancelling(false);
    }
  }, [booking, fetchBookingDetails]);

  const handleGoToBookings = useCallback(() => {
    navigate('/bookings');
  }, [navigate]);

  const handleGoToSupport = useCallback(() => {
    navigate('/support');
  }, [navigate]);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5" aria-hidden="true" />;
      case 'PENDING':
        return <Clock className="w-5 h-5" aria-hidden="true" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5" aria-hidden="true" />;
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5" aria-hidden="true" />;
      default:
        return <AlertCircle className="w-5 h-5" aria-hidden="true" />;
    }
  }, []);

  const getStatusText = useCallback((status: string): string => {
    switch (status) {
      case 'CONFIRMED':
        return 'Подтверждено';
      case 'PENDING':
        return 'В ожидании';
      case 'CANCELLED':
        return 'Отменено';
      case 'COMPLETED':
        return 'Завершено';
      default:
        return status;
    }
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatDateTime = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU');
  }, []);

  const getNightsText = useCallback((count: number): string => {
    if (count === 1) return 'ночь';
    if (count >= 2 && count <= 4) return 'ночи';
    return 'ночей';
  }, []);

  const getGuestsText = useCallback((count: number): string => {
    if (count === 1) return 'гость';
    if (count >= 2 && count <= 4) return 'гостя';
    return 'гостей';
  }, []);

  const getRoomsText = useCallback((count: number): string => {
    if (count === 1) return 'номер';
    if (count >= 2 && count <= 4) return 'номера';
    return 'номеров';
  }, []);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12" role="main" aria-label="Загрузка">
          <Container>
            <div
              className="text-center py-12"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"
                aria-hidden="true"
              />
              <p className="mt-4 text-gray-600">Загрузка деталей бронирования...</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Authentication guard
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12" role="main" aria-label="Требуется авторизация">
          <Container>
            <Card className="p-12 text-center" role="alert">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Требуется авторизация</h2>
              <p className="text-gray-600 mb-6">
                Для просмотра деталей бронирования необходимо войти в систему.
              </p>
              <Button href="/login">Войти</Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error && !booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12" role="main" aria-label="Ошибка">
          <Container>
            <Card className="p-12 text-center" role="alert">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Бронирование не найдено</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={handleGoToBookings}>Вернуться к бронированиям</Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Детали бронирования"
      >
        <Container>
          {/* Back Button */}
          <nav className="mb-6" aria-label="Навигация">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToBookings}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              К моим бронированиям
            </Button>
          </nav>

          {/* Success Message */}
          {success && (
            <Card
              id={successId}
              className="p-4 mb-6 bg-green-50 border-green-200"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" aria-hidden="true" />
                <span>{success}</span>
              </div>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card
              id={errorId}
              className="p-4 mb-6 bg-red-50 border-red-200"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Header */}
          <header className="mb-6">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
              <div>
                <h1 id={headingId} className="text-3xl font-bold text-gray-900 mb-2">
                  Детали бронирования
                </h1>
                <p className="text-gray-600 text-lg">
                  Номер: <span className="font-mono font-semibold">{booking.bookingReference}</span>
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${getStatusColor(booking.status)}`}
                role="status"
                aria-label={`Статус: ${getStatusText(booking.status)}`}
              >
                {getStatusIcon(booking.status)}
                <span className="font-semibold">{getStatusText(booking.status)}</span>
              </div>
            </div>
          </header>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Item Details */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  {booking.type === 'HOTEL' ? (
                    <HotelIcon className="w-6 h-6 text-primary-600" aria-hidden="true" />
                  ) : (
                    <Plane className="w-6 h-6 text-primary-600" aria-hidden="true" />
                  )}
                  <h2 className="text-2xl font-bold text-gray-900">
                    {booking.type === 'HOTEL' ? 'Информация об отеле' : 'Информация о рейсе'}
                  </h2>
                </div>

                {booking.itemDetails?.imageUrl && (
                  <div className="mb-6 rounded-lg overflow-hidden">
                    <img
                      src={booking.itemDetails.imageUrl}
                      alt={booking.itemDetails.name || 'Бронирование'}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  {booking.itemDetails?.name && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.itemDetails.name}
                      </h3>
                    </div>
                  )}
                  {booking.itemDetails?.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-5 h-5" aria-hidden="true" />
                      <span>{booking.itemDetails.location}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Booking Information */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Информация о бронировании</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <dl className="space-y-4">
                    <div>
                      <dt className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm font-medium">Дата заезда</span>
                      </dt>
                      <dd className="font-semibold text-gray-900">
                        <time dateTime={booking.checkIn}>{formatDate(booking.checkIn)}</time>
                      </dd>
                    </div>

                    <div>
                      <dt className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm font-medium">Дата выезда</span>
                      </dt>
                      <dd className="font-semibold text-gray-900">
                        <time dateTime={booking.checkOut}>{formatDate(booking.checkOut)}</time>
                      </dd>
                      <dd className="text-sm text-gray-600 mt-1">
                        {nights} {getNightsText(nights)}
                      </dd>
                    </div>
                  </dl>

                  <dl className="space-y-4">
                    <div>
                      <dt className="flex items-center gap-2 text-gray-600 mb-1">
                        <Users className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm font-medium">Гости</span>
                      </dt>
                      <dd className="font-semibold text-gray-900">
                        {booking.guests} {getGuestsText(booking.guests)}
                      </dd>
                    </div>

                    {booking.rooms && (
                      <div>
                        <dt className="flex items-center gap-2 text-gray-600 mb-1">
                          <HotelIcon className="w-4 h-4" aria-hidden="true" />
                          <span className="text-sm font-medium">Номера</span>
                        </dt>
                        <dd className="font-semibold text-gray-900">
                          {booking.rooms} {getRoomsText(booking.rooms)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>

              {/* Payment Information */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Информация об оплате</h3>
                <dl className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <dt className="text-gray-600">Способ оплаты</dt>
                    <dd className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      <span className="font-medium text-gray-900 capitalize">
                        {booking.paymentMethod.replace('_', ' ')}
                      </span>
                    </dd>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b">
                    <dt className="text-gray-600">Статус оплаты</dt>
                    <dd className="font-medium text-gray-900 capitalize">{booking.paymentStatus}</dd>
                  </div>

                  <div className="flex items-center justify-between text-lg pt-2">
                    <dt className="font-semibold text-gray-900">Итого</dt>
                    <dd className="font-bold text-primary-600">
                      {booking.totalPrice.toLocaleString('ru-RU')} {booking.currency}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6" aria-label="Действия и информация">
              {/* Actions Card */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Действия</h3>
                <div className="space-y-3">
                  <Button
                    fullWidth
                    variant="outline"
                    icon={<Download className="w-4 h-4" />}
                    disabled
                  >
                    Скачать счёт
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    icon={<Mail className="w-4 h-4" />}
                    disabled
                  >
                    Отправить подтверждение
                  </Button>
                  {booking.status === 'CONFIRMED' && (
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={handleOpenCancelModal}
                      loading={cancelling}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      {cancelling ? 'Отмена...' : 'Отменить бронирование'}
                    </Button>
                  )}
                </div>
              </Card>

              {/* Booking Metadata */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Метаданные</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-600">ID бронирования</dt>
                    <dd className="font-mono text-gray-900 mt-1">{booking.id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Создано</dt>
                    <dd className="text-gray-900 mt-1">
                      <time dateTime={booking.createdAt}>{formatDateTime(booking.createdAt)}</time>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Обновлено</dt>
                    <dd className="text-gray-900 mt-1">
                      <time dateTime={booking.updatedAt}>{formatDateTime(booking.updatedAt)}</time>
                    </dd>
                  </div>
                </dl>
              </Card>

              {/* Help Card */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Нужна помощь?</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Если у вас есть вопросы о бронировании, наша команда поддержки готова помочь.
                </p>
                <Button
                  fullWidth
                  variant="outline"
                  size="sm"
                  onClick={handleGoToSupport}
                  className="border-blue-600 text-blue-600 hover:bg-blue-100"
                >
                  Связаться с поддержкой
                </Button>
              </Card>
            </aside>
          </div>

          {/* Cancel Confirmation Modal */}
          {showCancelModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby={modalTitleId}
            >
              <Card className="max-w-md w-full p-6">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
                  <h2 id={modalTitleId} className="text-xl font-bold text-gray-900 mb-2">
                    Отменить бронирование?
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Вы уверены, что хотите отменить это бронирование? Это действие нельзя отменить.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleCloseCancelModal}
                    >
                      Назад
                    </Button>
                    <Button
                      fullWidth
                      onClick={handleConfirmCancel}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Да, отменить
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(BookingDetails);
