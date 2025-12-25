import React, { useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft, MapPin } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

/**
 * 404 Not Found page with navigation options.
 */
const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Страница не найдена"
      >
        <Container>
          <Card className="max-w-2xl mx-auto p-12 text-center">
            {/* 404 Illustration */}
            <div className="mb-8">
              <div className="relative inline-block">
                <span
                  className="text-9xl font-bold text-gray-200"
                  aria-hidden="true"
                >
                  404
                </span>
                <MapPin
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-primary-600"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Страница не найдена
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              К сожалению, запрашиваемая страница не существует или была перемещена.
              Возможно, вы ввели неправильный адрес или страница была удалена.
            </p>

            {/* Actions */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              role="group"
              aria-label="Навигация"
            >
              <Button
                onClick={handleGoBack}
                variant="outline"
                icon={<ArrowLeft className="w-5 h-5" />}
              >
                Назад
              </Button>
              <Button
                onClick={handleGoHome}
                icon={<Home className="w-5 h-5" />}
              >
                На главную
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Возможно, вы искали:
              </h2>
              <nav aria-label="Полезные ссылки">
                <ul className="flex flex-wrap justify-center gap-4 text-primary-600">
                  <li>
                    <a
                      href="/"
                      className="flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                    >
                      <Search className="w-4 h-4" aria-hidden="true" />
                      Поиск отелей
                    </a>
                  </li>
                  <li>
                    <a
                      href="/bookings"
                      className="flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                    >
                      Мои бронирования
                    </a>
                  </li>
                  <li>
                    <a
                      href="/support"
                      className="flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                    >
                      Поддержка
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(NotFound);
