import React, { useState } from 'react';
import { Heart, MapPin, Star } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const Favorites: React.FC = () => {
  const [favorites] = useState([
    {
      id: 1,
      name: 'Grand Hotel Paris',
      location: 'Париж, Франция',
      rating: 4.8,
      price: '$299',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
    },
    {
      id: 2,
      name: 'Tokyo Bay Resort',
      location: 'Токио, Япония',
      rating: 4.9,
      price: '$399',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
    },
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Избранное
            </h1>
            <p className="text-gray-600">
              Отели, которые вам понравились ({favorites.length})
            </p>
          </div>

          {favorites.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((hotel) => (
                <Card key={hotel.id} className="overflow-hidden">
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500" />
                    <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors">
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </button>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {hotel.name}
                    </h3>

                    <div className="flex items-center gap-1 text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{hotel.location}</span>
                    </div>

                    <div className="flex items-center gap-1 mb-4">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{hotel.rating}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">от</span>
                        <span className="text-2xl font-bold text-primary-600 ml-1">
                          {hotel.price}
                        </span>
                        <span className="text-sm text-gray-600">/ночь</span>
                      </div>
                      <Button size="sm">Забронировать</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Нет избранных отелей
              </h2>
              <p className="text-gray-600 mb-6">
                Добавляйте отели в избранное, чтобы легко находить их позже
              </p>
              <Button onClick={() => window.location.href = '/hotels'}>
                Найти отели
              </Button>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
