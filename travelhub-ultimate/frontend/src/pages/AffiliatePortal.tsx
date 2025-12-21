import React from 'react';
import { Users, TrendingUp, DollarSign, Award } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const AffiliatePortal: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Партнерская программа
            </h1>
            <p className="text-xl text-gray-600">
              Зарабатывайте с TravelHub
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 text-center">
              <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">1,245</h3>
              <p className="text-gray-600">Рефералов</p>
            </Card>

            <Card className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">+15.3%</h3>
              <p className="text-gray-600">Рост за месяц</p>
            </Card>

            <Card className="p-6 text-center">
              <DollarSign className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">$12,450</h3>
              <p className="text-gray-600">Заработано</p>
            </Card>

            <Card className="p-6 text-center">
              <Award className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Золото</h3>
              <p className="text-gray-600">Статус</p>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Как это работает</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Получите уникальную ссылку</h3>
                    <p className="text-gray-600 text-sm">
                      Зарегистрируйтесь и получите персональную реферальную ссылку
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Делитесь с друзьями</h3>
                    <p className="text-gray-600 text-sm">
                      Рассказывайте о TravelHub в соцсетях, блоге или друзьям
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Получайте вознаграждение</h3>
                    <p className="text-gray-600 text-sm">
                      Зарабатывайте 10% с каждого бронирования ваших рефералов
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Преимущества</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-gray-700">Комиссия до 10% от каждого бронирования</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-gray-700">Пассивный доход на всю жизнь</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-gray-700">Еженедельные выплаты</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-gray-700">Подробная статистика и аналитика</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-gray-700">Маркетинговые материалы</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-gray-700">Персональный менеджер</span>
                </li>
              </ul>

              <Button fullWidth className="mt-8">
                Стать партнером
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AffiliatePortal;
