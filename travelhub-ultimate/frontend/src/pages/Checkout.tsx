import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, Calendar, Users, MapPin } from 'lucide-react';
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

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Get booking details from navigation state
  const bookingDetails: BookingDetails = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [bookingData, setBookingData] = useState({
    checkIn: bookingDetails.checkIn || '',
    checkOut: bookingDetails.checkOut || '',
    guests: bookingDetails.guests || 2,
  });

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateTotal = (): number => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!bookingDetails.hotel) {
      setError('No hotel selected for booking');
      return;
    }

    setLoading(true);
    setError('');

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
        setError('Failed to create booking. Please try again.');
      }
    } catch (err: any) {
      logger.error('Failed to create booking', err);
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if no hotel selected
  if (!bookingDetails.hotel) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No Booking Selected
              </h2>
              <p className="text-gray-600 mb-6">
                Please select a hotel to book.
              </p>
              <Button href="/">Back to Home</Button>
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
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Please Log In
              </h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to complete your booking.
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Оформление бронирования
          </h1>

          {error && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Booking Details Card */}
              <Card className="p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary-600" />
                  Детали бронирования
                </h2>

                <div className="space-y-4">
                  <Input
                    label="Дата заезда"
                    type="date"
                    name="checkIn"
                    value={bookingData.checkIn}
                    onChange={handleBookingChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />

                  <Input
                    label="Дата выезда"
                    type="date"
                    name="checkOut"
                    value={bookingData.checkOut}
                    onChange={handleBookingChange}
                    required
                    min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Количество гостей
                    </label>
                    <select
                      name="guests"
                      value={bookingData.guests}
                      onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                  Способ оплаты
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Номер карты"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    maxLength={19}
                    required
                  />

                  <Input
                    label="Имя владельца карты"
                    name="cardName"
                    placeholder="IVAN IVANOV"
                    value={formData.cardName}
                    onChange={handleChange}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Срок действия"
                      name="expiry"
                      placeholder="MM/YY"
                      value={formData.expiry}
                      onChange={handleChange}
                      maxLength={5}
                      required
                    />

                    <Input
                      label="CVV"
                      name="cvv"
                      placeholder="123"
                      type="password"
                      value={formData.cvv}
                      onChange={handleChange}
                      maxLength={3}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Защищённое соединение. Ваши данные в безопасности.</span>
                  </div>

                  <Button type="submit" fullWidth size="lg" loading={loading}>
                    {loading ? 'Обработка...' : 'Подтвердить и оплатить'}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Summary Card */}
            <div>
              <Card className="p-6 sticky top-24">
                <h3 className="text-lg font-bold mb-4">Сводка заказа</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <div className="font-semibold">{bookingDetails.hotel.name}</div>
                      <div className="text-sm text-gray-600">{bookingDetails.hotel.location}</div>
                    </div>
                  </div>

                  {bookingData.checkIn && bookingData.checkOut && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <div className="text-sm text-gray-600">Check-in</div>
                        <div className="font-medium">
                          {new Date(bookingData.checkIn).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Check-out</div>
                        <div className="font-medium">
                          {new Date(bookingData.checkOut).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24))} ночей
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{bookingData.guests} {bookingData.guests === 1 ? 'гость' : 'гостя'}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Цена за ночь</span>
                    <span className="font-medium">{bookingDetails.hotel.price.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  {bookingData.checkIn && bookingData.checkOut && (
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-600">
                        {Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24))} ночей
                      </span>
                      <span className="font-medium">{calculateTotal().toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Итого</span>
                      <span className="text-primary-600">{calculateTotal().toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Бесплатная отмена</span>
                  </div>
                  <p className="text-xs text-green-700">
                    Отмена за 24 часа до заезда без штрафов
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
