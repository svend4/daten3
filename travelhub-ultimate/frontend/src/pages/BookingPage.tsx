import React, { useState, useCallback, useMemo, memo, useId } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, Plane, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

// Validation schema
const passengerInfoSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  phone: z.string().min(10, 'Введите корректный номер телефона'),
});

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passengers: number;
  specialRequests: string;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * Booking page - collects passenger info and confirms booking.
 */
const BookingPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    passengers: 1,
    specialRequests: '',
  });

  // Unique IDs for accessibility
  const headingId = useId();
  const formId = useId();
  const summaryId = useId();
  const step1Id = useId();
  const step2Id = useId();

  // Demo booking data
  const booking = {
    id: id || '1',
    type: 'flight',
    title: 'Москва → Санкт-Петербург',
    airline: 'Aeroflot',
    date: '15 января 2025',
    time: '10:30',
    price: 4500,
    details: {
      duration: '1ч 30м',
      class: 'Эконом',
      baggage: '1 место, 23кг',
    },
  };

  // Field change handlers using useCallback
  const handleFirstNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, firstName: value }));
    if (fieldErrors.firstName) {
      setFieldErrors(prev => ({ ...prev, firstName: undefined }));
    }
  }, [fieldErrors.firstName]);

  const handleLastNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, lastName: value }));
    if (fieldErrors.lastName) {
      setFieldErrors(prev => ({ ...prev, lastName: undefined }));
    }
  }, [fieldErrors.lastName]);

  const handleEmailChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: undefined }));
    }
  }, [fieldErrors.email]);

  const handlePhoneChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
    if (fieldErrors.phone) {
      setFieldErrors(prev => ({ ...prev, phone: undefined }));
    }
  }, [fieldErrors.phone]);

  const handlePassengersChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value, 10) }));
  }, []);

  const handleSpecialRequestsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, specialRequests: e.target.value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      // Validate form with Zod
      const result = passengerInfoSchema.safeParse(formData);
      if (!result.success) {
        const errors: FieldErrors = {};
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof FieldErrors;
          errors[field] = err.message;
        });
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      setStep(2);
    } else {
      navigate('/checkout', { state: { booking, formData } });
    }
  }, [step, formData, navigate, booking]);

  const handleGoBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  }, [step, navigate]);

  const handleGoToCheckout = useCallback(() => {
    navigate('/checkout', { state: { booking, formData } });
  }, [navigate, booking, formData]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return booking.price * formData.passengers + 300;
  }, [booking.price, formData.passengers]);

  // Get passenger text
  const getPassengerText = useCallback((count: number): string => {
    if (count === 1) return 'пассажир';
    if (count >= 2 && count <= 4) return 'пассажира';
    return 'пассажиров';
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-8"
        role="main"
        aria-label="Бронирование"
      >
        <Container className="max-w-4xl">
          {/* Back Button */}
          <nav aria-label="Навигация" className="mb-6">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              <span>{step === 2 ? 'К информации' : 'Назад'}</span>
            </button>
          </nav>

          {/* Progress Steps */}
          <nav className="mb-8" aria-label="Шаги бронирования">
            <ol className="flex items-center justify-center gap-4">
              <li className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div
                  id={step1Id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}
                  aria-current={step === 1 ? 'step' : undefined}
                >
                  1
                </div>
                <span className="font-medium">Информация</span>
              </li>
              <li className="w-16 h-0.5 bg-gray-300" aria-hidden="true" />
              <li className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div
                  id={step2Id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}
                  aria-current={step === 2 ? 'step' : undefined}
                >
                  2
                </div>
                <span className="font-medium">Подтверждение</span>
              </li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <h1 id={headingId} className="text-3xl font-bold text-gray-900 mb-6">
                  {step === 1 ? 'Информация о пассажирах' : 'Подтверждение бронирования'}
                </h1>

                {step === 1 ? (
                  <form
                    id={formId}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    aria-labelledby={headingId}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Имя"
                        value={formData.firstName}
                        onChange={handleFirstNameChange}
                        placeholder="Иван"
                        required
                        error={fieldErrors.firstName}
                        autoComplete="given-name"
                      />
                      <Input
                        label="Фамилия"
                        value={formData.lastName}
                        onChange={handleLastNameChange}
                        placeholder="Иванов"
                        required
                        error={fieldErrors.lastName}
                        autoComplete="family-name"
                      />
                    </div>

                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      placeholder="your@email.com"
                      required
                      error={fieldErrors.email}
                      autoComplete="email"
                    />

                    <Input
                      label="Телефон"
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="+7 (___) ___-__-__"
                      required
                      error={fieldErrors.phone}
                      autoComplete="tel"
                    />

                    <div>
                      <label
                        htmlFor="passengers-count"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Количество пассажиров
                      </label>
                      <select
                        id="passengers-count"
                        value={formData.passengers}
                        onChange={handlePassengersChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="1">1 пассажир</option>
                        <option value="2">2 пассажира</option>
                        <option value="3">3 пассажира</option>
                        <option value="4">4+ пассажиров</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="special-requests"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Особые пожелания (опционально)
                      </label>
                      <textarea
                        id="special-requests"
                        value={formData.specialRequests}
                        onChange={handleSpecialRequestsChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Укажите любые особые требования..."
                      />
                    </div>

                    <Button type="submit" fullWidth size="lg">
                      Продолжить
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <section className="bg-gray-50 rounded-lg p-6" aria-labelledby="trip-details-heading">
                      <h2 id="trip-details-heading" className="font-bold text-lg mb-4">
                        Детали поездки
                      </h2>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Маршрут</dt>
                          <dd className="font-medium">{booking.title}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Дата</dt>
                          <dd className="font-medium">{booking.date}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Время</dt>
                          <dd className="font-medium">{booking.time}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Пассажиры</dt>
                          <dd className="font-medium">
                            {formData.passengers} {getPassengerText(formData.passengers)}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section className="bg-gray-50 rounded-lg p-6" aria-labelledby="contact-details-heading">
                      <h2 id="contact-details-heading" className="font-bold text-lg mb-4">
                        Контактная информация
                      </h2>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Имя</dt>
                          <dd className="font-medium">{formData.firstName} {formData.lastName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Email</dt>
                          <dd className="font-medium">{formData.email}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Телефон</dt>
                          <dd className="font-medium">{formData.phone}</dd>
                        </div>
                      </dl>
                    </section>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={handleGoBack} className="flex-1">
                        Назад
                      </Button>
                      <Button onClick={handleGoToCheckout} className="flex-1">
                        К оплате
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Summary Sidebar */}
            <aside className="lg:col-span-1" aria-labelledby={summaryId}>
              <Card className="p-6 sticky top-8">
                <h2 id={summaryId} className="font-bold text-xl mb-4">
                  Сводка бронирования
                </h2>

                <dl className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Plane className="w-5 h-5 text-primary-600 mt-1" aria-hidden="true" />
                    <div>
                      <dt className="sr-only">Маршрут</dt>
                      <dd className="font-medium">{booking.title}</dd>
                      <dd className="text-sm text-gray-600">{booking.airline}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary-600 mt-1" aria-hidden="true" />
                    <div>
                      <dt className="sr-only">Дата и время</dt>
                      <dd className="font-medium">{booking.date}</dd>
                      <dd className="text-sm text-gray-600">{booking.time}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary-600 mt-1" aria-hidden="true" />
                    <div>
                      <dt className="sr-only">Пассажиры и класс</dt>
                      <dd className="font-medium">
                        {formData.passengers} {getPassengerText(formData.passengers)}
                      </dd>
                      <dd className="text-sm text-gray-600">{booking.details.class}</dd>
                    </div>
                  </div>
                </dl>

                <dl className="border-t border-gray-200 pt-4 mb-6 space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Стоимость билета</dt>
                    <dd className="font-medium">{booking.price.toLocaleString('ru-RU')} ₽</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Пассажиры × {formData.passengers}</dt>
                    <dd className="font-medium">
                      {(booking.price * formData.passengers).toLocaleString('ru-RU')} ₽
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Сервисный сбор</dt>
                    <dd className="font-medium">300 ₽</dd>
                  </div>
                </dl>

                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Итого</span>
                    <span className="text-2xl font-bold text-primary-600" aria-live="polite">
                      {totalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
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

export default memo(BookingPage);
