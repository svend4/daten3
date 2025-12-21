import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Plane, CreditCard } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const BookingPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    passengers: 1,
    specialRequests: '',
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      navigate('/checkout', { state: { booking, formData } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                  1
                </div>
                <span className="font-medium">Информация</span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                  2
                </div>
                <span className="font-medium">Подтверждение</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  {step === 1 ? 'Информация о пассажирах' : 'Подтверждение бронирования'}
                </h1>

                {step === 1 ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Имя"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Иван"
                        required
                      />
                      <Input
                        label="Фамилия"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Иванов"
                        required
                      />
                    </div>

                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                    />

                    <Input
                      label="Телефон"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+7 (___) ___-__-__"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Количество пассажиров
                      </label>
                      <select
                        name="passengers"
                        value={formData.passengers}
                        onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="1">1 пассажир</option>
                        <option value="2">2 пассажира</option>
                        <option value="3">3 пассажира</option>
                        <option value="4">4+ пассажиров</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Особые пожелания (опционально)
                      </label>
                      <textarea
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleChange}
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
                    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                      <h3 className="font-bold text-lg mb-4">Детали поездки</h3>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Маршрут</span>
                        <span className="font-medium">{booking.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Дата</span>
                        <span className="font-medium">{booking.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Время</span>
                        <span className="font-medium">{booking.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Пассажиры</span>
                        <span className="font-medium">{formData.passengers}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                      <h3 className="font-bold text-lg mb-4">Контактная информация</h3>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Имя</span>
                        <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email</span>
                        <span className="font-medium">{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Телефон</span>
                        <span className="font-medium">{formData.phone}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                        Назад
                      </Button>
                      <Button onClick={() => navigate('/checkout')} className="flex-1">
                        К оплате
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                <h3 className="font-bold text-xl mb-4">Сводка бронирования</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Plane className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <p className="font-medium">{booking.title}</p>
                      <p className="text-sm text-gray-600">{booking.airline}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <p className="font-medium">{booking.date}</p>
                      <p className="text-sm text-gray-600">{booking.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <p className="font-medium">{formData.passengers || 1} пассажир(ов)</p>
                      <p className="text-sm text-gray-600">{booking.details.class}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Стоимость билета</span>
                    <span className="font-medium">{booking.price} ₽</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Пассажиры × {formData.passengers || 1}</span>
                    <span className="font-medium">{booking.price * (formData.passengers || 1)} ₽</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Сервисный сбор</span>
                    <span className="font-medium">300 ₽</span>
                  </div>
                </div>

                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Итого</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {(booking.price * (formData.passengers || 1) + 300).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingPage;
