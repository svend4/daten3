import React, { useState, useCallback, memo, useId } from 'react';
import { Star, Plus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

interface Review {
  id: number;
  hotelName: string;
  rating: number;
  comment: string;
  date: string;
}

/**
 * Reviews page - displays user's hotel reviews.
 */
const Reviews: React.FC = () => {
  const navigate = useNavigate();
  const [reviews] = useState<Review[]>([
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

  // Unique IDs for accessibility
  const headingId = useId();
  const reviewsListId = useId();

  const renderStars = useCallback((rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
        aria-hidden="true"
      />
    ));
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const getReviewCountText = useCallback((count: number): string => {
    if (count === 1) return 'отзыв';
    if (count >= 2 && count <= 4) return 'отзыва';
    return 'отзывов';
  }, []);

  const handleNewReview = useCallback(() => {
    // Navigate to create review page (could be implemented)
    navigate('/bookings');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Мои отзывы"
      >
        <Container className="max-w-4xl">
          <header className="mb-8">
            <h1 id={headingId} className="text-3xl font-bold text-gray-900 mb-2">
              Мои отзывы
            </h1>
            <p className="text-gray-600">
              {reviews.length > 0
                ? `У вас ${reviews.length} ${getReviewCountText(reviews.length)}`
                : 'Поделитесь своим опытом о посещённых отелях'}
            </p>
          </header>

          <div className="mb-6">
            <Button
              onClick={handleNewReview}
              icon={<Plus className="w-5 h-5" />}
            >
              Написать новый отзыв
            </Button>
          </div>

          {reviews.length > 0 ? (
            <section aria-labelledby={headingId}>
              <ul
                id={reviewsListId}
                className="space-y-4"
                role="list"
                aria-label="Список отзывов"
              >
                {reviews.map((review) => (
                  <li key={review.id}>
                    <Card className="p-6">
                      <article aria-label={`Отзыв об отеле ${review.hotelName}`}>
                        <header className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-2">
                          <div>
                            <h2 className="text-lg font-bold text-gray-900">
                              {review.hotelName}
                            </h2>
                            <time
                              dateTime={review.date}
                              className="text-sm text-gray-500"
                            >
                              {formatDate(review.date)}
                            </time>
                          </div>
                          <div
                            className="flex gap-1"
                            role="img"
                            aria-label={`Рейтинг: ${review.rating} из 5`}
                          >
                            {renderStars(review.rating)}
                          </div>
                        </header>
                        <p className="text-gray-700">{review.comment}</p>
                      </article>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <Card className="p-12 text-center" role="status">
              <MessageSquare
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                aria-hidden="true"
              />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Нет отзывов
              </h2>
              <p className="text-gray-500 mb-6">
                У вас пока нет отзывов. Забронируйте отель и оставьте первый
                отзыв!
              </p>
              <Button onClick={handleNewReview}>
                Найти отель
              </Button>
            </Card>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(Reviews);
