import React, { useState } from 'react';
import { Star } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const Reviews: React.FC = () => {
  const [reviews] = useState([
    {
      id: 1,
      hotelName: 'Grand Hotel Paris',
      rating: 5,
      comment: 'Отличный отель! Всё понравилось.',
      date: '2024-12-15',
    },
    {
      id: 2,
      hotelName: 'Tokyo Bay Resort',
      rating: 4,
      comment: 'Хорошее обслуживание, удобное расположение.',
      date: '2024-12-10',
    },
  ]);

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Мои отзывы
            </h1>
            <p className="text-gray-600">
              Поделитесь своим опытом о посещённых отелях
            </p>
          </div>

          <div className="mb-6">
            <Button>Написать новый отзыв</Button>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {review.hotelName}
                    </h3>
                    <p className="text-sm text-gray-500">{review.date}</p>
                  </div>
                  <div className="flex gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </Card>
            ))}
          </div>

          {reviews.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-500">
                У вас пока нет отзывов. Забронируйте отель и оставьте первый
                отзыв!
              </p>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Reviews;
