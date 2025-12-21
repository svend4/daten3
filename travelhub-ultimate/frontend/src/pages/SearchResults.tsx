import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, ArrowLeft } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const SearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = location.state?.searchParams;
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'rating'>('price');

  // Demo search results
  const results = [
    {
      id: '1',
      type: 'flight',
      title: 'Москва → Санкт-Петербург',
      provider: 'Aeroflot',
      price: 4500,
      rating: 4.5,
      duration: '1ч 30м',
    },
    {
      id: '2',
      type: 'hotel',
      title: 'Grand Hotel',
      provider: 'Центр Москвы',
      price: 8500,
      rating: 4.8,
      duration: 'за ночь',
    },
    {
      id: '3',
      type: 'flight',
      title: 'Москва → Париж',
      provider: 'Air France',
      price: 15000,
      rating: 4.7,
      duration: '3ч 45м',
    },
  ];

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад к поиску
          </button>

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Результаты поиска
              </h1>
              <p className="text-gray-600">
                Найдено {results.length} вариантов
              </p>
            </div>

            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20"
              >
                <option value="price">Цена: дешевле</option>
                <option value="rating">Рейтинг: выше</option>
                <option value="duration">Длительность</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50">
                <SlidersHorizontal className="w-5 h-5" />
                Фильтры
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {sortedResults.map((result) => (
              <Card key={result.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded">
                        {result.type === 'flight' ? 'Авиабилет' : 'Отель'}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        ⭐ {result.rating}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {result.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{result.provider}</p>
                    <p className="text-sm text-gray-500">{result.duration}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {result.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <Button
                      onClick={() => {
                        if (result.type === 'flight') {
                          navigate(`/booking/${result.id}`);
                        } else {
                          navigate(`/hotel/${result.id}`);
                        }
                      }}
                    >
                      Подробнее
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {results.length === 0 && (
            <Card className="p-12 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Ничего не найдено
              </h3>
              <p className="text-gray-600 mb-6">
                Попробуйте изменить параметры поиска
              </p>
              <Button onClick={() => navigate('/')}>
                Новый поиск
              </Button>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchResults;
