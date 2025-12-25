import React, { useState, useCallback, memo, useId } from 'react';
import { CreditCard, CheckCircle, AlertCircle, Calendar, Users, MapPin, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { paymentCardSchema, bookingDatesSchema, validateForm } from '../utils/validators';

interface BookingDetails {
  hotel?: {
    id: string;
    name: string;
    location: string;
    price: number;
  };
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  totalAmount?: number;
}

interface BookingData {
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface PaymentData {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

/**
 * Checkout page for completing hotel bookings.
 */
const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Get booking details from navigation state
  const bookingDetails: BookingDetails = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  // Unique IDs for accessibility
  const errorId = useId();
  const bookingFormId = useId();
  const paymentFormId = useId();
  const summaryId = useId();

  const [bookingData, setBookingData] = useState<BookingData>({
    checkIn: bookingDetails.checkIn || '',
    checkOut: bookingDetails.checkOut || '',
    guests: bookingDetails.guests || 2,
  });

  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  const handleBookingInputChange = useCallback((field: keyof BookingData, value: string | number) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (bookingErrors[field]) {
      setBookingErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [bookingErrors]);

  const handlePaymentInputChange = useCallback((field: keyof PaymentData, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (paymentErrors[field]) {
      setPaymentErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [paymentErrors]);

  const handleGuestsChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }));
  }, []);

  const calculateTotal = useCallback((): number => {
    if (bookingDetails.totalAmount) {
      return bookingDetails.totalAmount;
    }

    // Calculate based on hotel price and number of nights
    if (bookingDetails.hotel && bookingData.checkIn && bookingData.checkOut) {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return bookingDetails.hotel.price * Math.max(1, nights);
    }

    return bookingDetails.hotel?.price || 0;
  }, [bookingDetails, bookingData.checkIn, bookingData.checkOut]);

  const calculateNights = useCallback((): number => {
    if (bookingData.checkIn && bookingData.checkOut) {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 1;
  }, [bookingData.checkIn, bookingData.checkOut]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!bookingDetails.hotel) {
      setError('Не выбран отель для бронирования');
      return;
    }

    // Validate booking dates
    const bookingResult = validateForm(bookingDatesSchema, bookingData);
    if (!bookingResult.success) {
      setBookingErrors(bookingResult.errors || {});
      return;
    }

    // Validate payment data
    const paymentResult = validateForm(paymentCardSchema, paymentData);
    if (!paymentResult.success) {
      setPaymentErrors(paymentResult.errors || {});
      return;
    }

    setLoading(true);
    setError('');
    setBookingErrors({});
    setPaymentErrors({});

    try {
      // Create booking
      const response = await api.post<{
        success: boolean;
        data: {
          booking: {
            id: string;
            bookingReference: string;
            status: string;
          };
        };
      }>('/bookings', {
        type: 'hotel',
        itemId: bookingDetails.hotel.id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        rooms: 1,
        totalAmount: calculateTotal(),
        currency: 'RUB',
        paymentMethod: 'credit_card',
      });

      if (response.success && response.data.booking) {
        logger.info('Booking created successfully', response.data.booking);

        // Navigate to success page with booking details
        navigate('/payment/success', {
          state: {
            booking: response.data.booking,
            hotel: bookingDetails.hotel,
          },
        });
      } else {
        setError('Не удалось создать бронирование. Попробуйте снова.');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to create booking', err);
      setError(apiError.response?.data?.message || 'Не удалось создать бронирование. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, bookingDetails, bookingData, paymentData, calculateTotal, navigate]);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleNavigateToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Redirect if no hotel selected
  if (!bookingDetails.hotel) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Оформление бронирования"
        >
          <Container>
            <Card className="p-12 text-center" role="alert">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Отель не выбран
              </h1>
              <p className="text-gray-600 mb-6">
                Пожалуйста, выберите отель для бронирования.
              </p>
              <Button onClick={handleNavigateToHome}>
                Вернуться на главную
              </Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Redirect to login if not authenticated
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
                Для завершения бронирования необходимо войти в аккаунт.
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
        aria-label="Оформление бронирования"
      >
        <Container>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Оформление бронирования
            </h1>
          </header>

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

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Booking Details Card */}
              <Card className="p-8">
                <h2
                  id={bookingFormId}
                  className="text-xl font-bold mb-6 flex items-center gap-2"
                >
                  <Calendar className="w-6 h-6 text-primary-600" aria-hidden="true" />
                  Детали бронирования
                </h2>

                <div className="space-y-4" role="group" aria-labelledby={bookingFormId}>
                  <Input
                    label="Дата заезда"
                    type="date"
                    name="checkIn"
                    value={bookingData.checkIn}
                    onChange={(value) => handleBookingInputChange('checkIn', value)}
                    error={bookingErrors.checkIn}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />

                  <Input
                    label="Дата выезда"
                    type="date"
                    name="checkOut"
                    value={bookingData.checkOut}
                    onChange={(value) => handleBookingInputChange('checkOut', value)}
                    error={bookingErrors.checkOut}
                    required
                    min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                  />

                  <div>
                    <label
                      htmlFor="guests-select"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Количество гостей
                    </label>
                    <select
                      id="guests-select"
                      name="guests"
                      value={bookingData.guests}
                      onChange={handleGuestsChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      aria-describedby="guests-help"
                    >
                      <option value="1">1 гость</option>
                      <option value="2">2 гостя</option>
                      <option value="3">3 гостя</option>
                      <option value="4">4 гостя</option>
                      <option value="5">5+ гостей</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Payment Details Card */}
              <Card className="p-8">
                <h2
                  id={paymentFormId}
                  className="text-xl font-bold mb-6 flex items-center gap-2"
                >
                  <CreditCard className="w-6 h-6 text-primary-600" aria-hidden="true" />
                  Способ оплаты
                </h2>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  aria-labelledby={paymentFormId}
                >
                  <Input
                    label="Номер карты"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(value) => handlePaymentInputChange('cardNumber', value)}
                    error={paymentErrors.cardNumber}
                    maxLength={19}
                    required
                    icon={<CreditCard className="w-5 h-5" />}
                    autoComplete="cc-number"
                  />

                  <Input
                    label="Имя владельца карты"
                    name="cardName"
                    placeholder="IVAN IVANOV"
                    value={paymentData.cardName}
                    onChange={(value) => handlePaymentInputChange('cardName', value)}
                    error={paymentErrors.cardName}
                    required
                    autoComplete="cc-name"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Срок действия"
                      name="expiry"
                      placeholder="MM/YY"
                      value={paymentData.expiry}
                      onChange={(value) => handlePaymentInputChange('expiry', value)}
                      error={paymentErrors.expiry}
                      maxLength={5}
                      required
                      autoComplete="cc-exp"
                    />

                    <Input
                      label="CVV"
                      name="cvv"
                      placeholder="123"
                      type="password"
                      value={paymentData.cvv}
                      onChange={(value) => handlePaymentInputChange('cvv', value)}
                      error={paymentErrors.cvv}
                      maxLength={4}
                      required
                      autoComplete="cc-csc"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600" role="status">
                    <Lock className="w-5 h-5 text-green-600" aria-hidden="true" />
                    <span>Защищённое соединение. Ваши данные в безопасности.</span>
                  </div>

                  <Button type="submit" fullWidth size="lg" loading={loading}>
                    {loading ? 'Обработка...' : 'Подтвердить и оплатить'}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Summary Card */}
            <aside aria-labelledby={summaryId}>
              <Card className="p-6 sticky top-24">
                <h3 id={summaryId} className="text-lg font-bold mb-4">
                  Сводка заказа
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" aria-hidden="true" />
                    <div>
                      <div className="font-semibold">{bookingDetails.hotel.name}</div>
                      <div className="text-sm text-gray-600">{bookingDetails.hotel.location}</div>
                    </div>
                  </div>

                  {bookingData.checkIn && bookingData.checkOut && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-500 mt-1" aria-hidden="true" />
                      <div>
                        <div className="text-sm text-gray-600">Заезд</div>
                        <time
                          dateTime={bookingData.checkIn}
                          className="font-medium"
                        >
                          {new Date(bookingData.checkIn).toLocaleDateString('ru-RU')}
                        </time>
                        <div className="text-sm text-gray-600 mt-1">Выезд</div>
                        <time
                          dateTime={bookingData.checkOut}
                          className="font-medium"
                        >
                          {new Date(bookingData.checkOut).toLocaleDateString('ru-RU')}
                        </time>
                        <div className="text-xs text-gray-500 mt-1">
                          {calculateNights()} {getNightsText(calculateNights())}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-500" aria-hidden="true" />
                    <div>
                      <div className="font-medium">
                        {bookingData.guests} {getGuestsText(bookingData.guests)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Цена за ночь</span>
                    <span className="font-medium">
                      {bookingDetails.hotel.price.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  {bookingData.checkIn && bookingData.checkOut && (
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-600">
                        {calculateNights()} {getNightsText(calculateNights())}
                      </span>
                      <span className="font-medium">
                        {calculateTotal().toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Итого</span>
                      <span className="text-primary-600">
                        {calculateTotal().toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    <span className="font-medium">Бесплатная отмена</span>
                  </div>
                  <p className="text-xs text-green-700">
                    Отмена за 24 часа до заезда без штрафов
                  </p>
                </div>
              </Card>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

/**
 * Get proper Russian plural form for nights.
 */
function getNightsText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'ночей';
  if (lastOne === 1) return 'ночь';
  if (lastOne >= 2 && lastOne <= 4) return 'ночи';
  return 'ночей';
}

/**
 * Get proper Russian plural form for guests.
 */
function getGuestsText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'гостей';
  if (lastOne === 1) return 'гость';
  if (lastOne >= 2 && lastOne <= 4) return 'гостя';
  return 'гостей';
}

export default memo(Checkout);
