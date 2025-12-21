import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, CreditCard, Mail, Plane, Hotel } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.booking;

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  // Demo booking data if none provided
  const booking = bookingData || {
    id: 'BK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    type: 'flight',
    title: 'Москва → Санкт-Петербург',
    date: '15 января 2025',
    time: '10:30',
    price: 4500,
    email: 'user@example.com',
  };

  const handleDownloadTicket = () => {
    alert('Загрузка электронного билета...');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Оплата успешна!
            </h1>
            <p className="text-xl text-gray-600">
              Ваше бронирование подтверждено
            </p>
          </div>

          {/* Booking Details Card */}
          <Card className="p-8 mb-6">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                {booking.type === 'flight' ? (
                  <Plane className="w-8 h-8 text-primary-600" />
                ) : (
                  <Hotel className="w-8 h-8 text-primary-600" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {booking.title}
                  </h2>
                  <p className="text-gray-600">
                    {booking.type === 'flight' ? 'Авиабилет' : 'Отель'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">Дата поездки</span>
                  </div>
                  <p className="font-semibold text-gray-900">{booking.date}</p>
                  {booking.time && (
                    <p className="text-sm text-gray-600">{booking.time}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-sm">Сумма оплаты</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-2xl">
                    {booking.price.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-3">Номер бронирования</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-mono text-2xl font-bold text-primary-600 text-center">
                    {booking.id}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Сохраните этот номер для отслеживания бронирования
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">
                      Подтверждение отправлено
                    </p>
                    <p className="text-sm text-blue-700">
                      Детали бронирования отправлены на {booking.email || 'вашу электронную почту'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="p-8 mb-6">
            <h3 className="font-bold text-xl mb-4">Что дальше?</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-bold mb-1">Проверьте email</h4>
                  <p className="text-gray-600 text-sm">
                    Мы отправили подтверждение бронирования и электронный билет на вашу почту
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-bold mb-1">Сохраните билет</h4>
                  <p className="text-gray-600 text-sm">
                    Распечатайте или сохраните электронный билет на телефон
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-bold mb-1">Подготовьтесь к поездке</h4>
                  <p className="text-gray-600 text-sm">
                    Не забудьте взять паспорт и приехать заранее
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              fullWidth
              size="lg"
              onClick={handleDownloadTicket}
            >
              Скачать билет
            </Button>
            <Button
              variant="outline"
              fullWidth
              size="lg"
              onClick={() => navigate('/my-bookings')}
            >
              Мои бронирования
            </Button>
            <Button
              variant="outline"
              fullWidth
              size="lg"
              onClick={() => navigate('/')}
            >
              На главную
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
