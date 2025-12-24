import React, { useEffect, useCallback, useState, memo, useId } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, CreditCard, Mail, Plane, Hotel, Download, List, Home } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

interface BookingData {
  id: string;
  type: 'flight' | 'hotel';
  title: string;
  date: string;
  time?: string;
  price: number;
  email?: string;
}

/**
 * Payment success page - confirms booking completion.
 */
const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.booking;

  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Unique IDs for accessibility
  const headingId = useId();
  const bookingDetailsId = useId();
  const nextStepsId = useId();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  // Demo booking data if none provided
  const booking: BookingData = bookingData || {
    id: 'BK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    type: 'flight',
    title: 'Москва → Санкт-Петербург',
    date: '15 января 2025',
    time: '10:30',
    price: 4500,
    email: 'user@example.com',
  };

  const handleDownloadTicket = useCallback(async () => {
    setDownloading(true);
    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDownloading(false);
    setDownloadSuccess(true);

    // Reset success state after 3 seconds
    setTimeout(() => setDownloadSuccess(false), 3000);
  }, []);

  const handleNavigateToBookings = useCallback(() => {
    navigate('/bookings');
  }, [navigate]);

  const handleNavigateToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Успешная оплата"
      >
        <Container>
          <div className="max-w-3xl mx-auto">
            {/* Success Icon */}
            <header className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
                aria-hidden="true"
              >
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h1 id={headingId} className="text-4xl font-bold text-gray-900 mb-2">
                Оплата успешна!
              </h1>
              <p className="text-xl text-gray-600">
                Ваше бронирование подтверждено
              </p>
            </header>

            {/* Booking Details Card */}
            <Card className="p-8 mb-6" aria-labelledby={bookingDetailsId}>
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {booking.type === 'flight' ? (
                    <Plane className="w-8 h-8 text-primary-600" aria-hidden="true" />
                  ) : (
                    <Hotel className="w-8 h-8 text-primary-600" aria-hidden="true" />
                  )}
                  <div>
                    <h2 id={bookingDetailsId} className="text-2xl font-bold text-gray-900">
                      {booking.title}
                    </h2>
                    <p className="text-gray-600">
                      {booking.type === 'flight' ? 'Авиабилет' : 'Отель'}
                    </p>
                  </div>
                </div>

                <dl className="grid md:grid-cols-2 gap-6">
                  <div>
                    <dt className="flex items-center gap-2 text-gray-600 mb-2">
                      <Calendar className="w-5 h-5" aria-hidden="true" />
                      <span className="text-sm">Дата поездки</span>
                    </dt>
                    <dd className="font-semibold text-gray-900">{booking.date}</dd>
                    {booking.time && (
                      <dd className="text-sm text-gray-600">{booking.time}</dd>
                    )}
                  </div>

                  <div>
                    <dt className="flex items-center gap-2 text-gray-600 mb-2">
                      <CreditCard className="w-5 h-5" aria-hidden="true" />
                      <span className="text-sm">Сумма оплаты</span>
                    </dt>
                    <dd className="font-semibold text-gray-900 text-2xl">
                      {booking.price.toLocaleString('ru-RU')} ₽
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-3">Номер бронирования</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p
                      className="font-mono text-2xl font-bold text-primary-600 text-center"
                      aria-label={`Номер бронирования: ${booking.id}`}
                    >
                      {booking.id}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Сохраните этот номер для отслеживания бронирования
                  </p>
                </div>

                <div
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  role="status"
                >
                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
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

                {/* Download Success Message */}
                {downloadSuccess && (
                  <div
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" aria-hidden="true" />
                      <span>Билет успешно загружен!</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="p-8 mb-6" aria-labelledby={nextStepsId}>
              <h3 id={nextStepsId} className="font-bold text-xl mb-4">
                Что дальше?
              </h3>
              <ol className="space-y-4" aria-label="Следующие шаги">
                <li className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold"
                    aria-hidden="true"
                  >
                    1
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Проверьте email</h4>
                    <p className="text-gray-600 text-sm">
                      Мы отправили подтверждение бронирования и электронный билет на вашу почту
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold"
                    aria-hidden="true"
                  >
                    2
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Сохраните билет</h4>
                    <p className="text-gray-600 text-sm">
                      Распечатайте или сохраните электронный билет на телефон
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold"
                    aria-hidden="true"
                  >
                    3
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Подготовьтесь к поездке</h4>
                    <p className="text-gray-600 text-sm">
                      Не забудьте взять паспорт и приехать заранее
                    </p>
                  </div>
                </li>
              </ol>
            </Card>

            {/* Action Buttons */}
            <nav
              className="flex flex-col sm:flex-row gap-4"
              role="group"
              aria-label="Действия"
            >
              <Button
                fullWidth
                size="lg"
                onClick={handleDownloadTicket}
                loading={downloading}
                icon={<Download className="w-5 h-5" />}
              >
                {downloading ? 'Загрузка...' : 'Скачать билет'}
              </Button>
              <Button
                variant="outline"
                fullWidth
                size="lg"
                onClick={handleNavigateToBookings}
                icon={<List className="w-5 h-5" />}
              >
                Мои бронирования
              </Button>
              <Button
                variant="outline"
                fullWidth
                size="lg"
                onClick={handleNavigateToHome}
                icon={<Home className="w-5 h-5" />}
              >
                На главную
              </Button>
            </nav>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(PaymentSuccess);
