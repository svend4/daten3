import React, { useState, useCallback, useMemo, memo, useId } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, ArrowLeft, Plane, Hotel, Star, Search } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

type SortOption = 'price' | 'duration' | 'rating';

interface SearchResult {
  id: string;
  type: 'flight' | 'hotel';
  title: string;
  provider: string;
  price: number;
  rating: number;
  duration: string;
}

/**
 * Search results page - displays flight and hotel search results.
 */
const SearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = location.state?.searchParams;
  const [sortBy, setSortBy] = useState<SortOption>('price');

  // Unique IDs for accessibility
  const headingId = useId();
  const resultsId = useId();
  const sortLabelId = useId();

  // Demo search results
  const results: SearchResult[] = [
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

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [sortBy]);

  // Helper for result count text
  const getResultsCountText = useCallback((count: number): string => {
    if (count === 0) return 'вариантов';
    if (count === 1) return 'вариант';
    if (count >= 2 && count <= 4) return 'варианта';
    return 'вариантов';
  }, []);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.type === 'flight') {
      navigate(`/booking/${result.id}`);
    } else {
      navigate(`/hotel/${result.id}`);
    }
  }, [navigate]);

  const handleNewSearch = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-8"
        role="main"
        aria-label="Результаты поиска"
      >
        <Container className="max-w-6xl">
          {/* Back Button */}
          <nav aria-label="Навигация">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
              aria-label="Вернуться к поиску"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              <span>Назад к поиску</span>
            </button>
          </nav>

          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 id={headingId} className="text-3xl font-bold text-gray-900 mb-2">
                Результаты поиска
              </h1>
              <p className="text-gray-600" aria-live="polite">
                Найдено {results.length} {getResultsCountText(results.length)}
              </p>
            </div>

            <div className="flex gap-3" role="group" aria-label="Сортировка и фильтры">
              <div>
                <label id={sortLabelId} className="sr-only">
                  Сортировать по
                </label>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  aria-labelledby={sortLabelId}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="price">Цена: дешевле</option>
                  <option value="rating">Рейтинг: выше</option>
                  <option value="duration">Длительность</option>
                </select>
              </div>

              <button
                className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Открыть фильтры"
              >
                <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
                <span>Фильтры</span>
              </button>
            </div>
          </header>

          {/* Results List */}
          <section aria-labelledby={headingId}>
            <ul
              id={resultsId}
              className="space-y-4"
              role="list"
              aria-label="Список результатов"
            >
              {sortedResults.map((result) => (
                <li key={result.id}>
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <article className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded">
                            {result.type === 'flight' ? (
                              <>
                                <Plane className="w-3 h-3" aria-hidden="true" />
                                <span>Авиабилет</span>
                              </>
                            ) : (
                              <>
                                <Hotel className="w-3 h-3" aria-hidden="true" />
                                <span>Отель</span>
                              </>
                            )}
                          </span>
                          <span
                            className="flex items-center gap-1 text-sm text-gray-600"
                            aria-label={`Рейтинг ${result.rating}`}
                          >
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                            <span>{result.rating}</span>
                          </span>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                          {result.title}
                        </h2>
                        <p className="text-gray-600 mb-2">{result.provider}</p>
                        <p className="text-sm text-gray-500">{result.duration}</p>
                      </div>

                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {result.price.toLocaleString('ru-RU')} ₽
                        </div>
                        <Button onClick={() => handleResultClick(result)}>
                          Подробнее
                        </Button>
                      </div>
                    </article>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          {/* Empty State */}
          {results.length === 0 && (
            <Card className="p-12 text-center" role="status">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ничего не найдено
              </h2>
              <p className="text-gray-600 mb-6">
                Попробуйте изменить параметры поиска
              </p>
              <Button onClick={handleNewSearch}>
                Новый поиск
              </Button>
            </Card>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(SearchResults);
