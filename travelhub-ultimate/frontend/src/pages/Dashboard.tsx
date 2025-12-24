import React, { useState, useEffect, useCallback, useMemo, memo, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Heart,
  Bell,
  Settings as SettingsIcon,
  User,
  AlertCircle,
  ChevronRight,
  Plane,
  Hotel as HotelIcon,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface DashboardStats {
  bookingsCount: number;
  favoritesCount: number;
  priceAlertsCount: number;
}

interface RecentBooking {
  id: string;
  type: 'HOTEL' | 'FLIGHT';
  status: string;
  createdAt: string;
  totalPrice: number;
  currency: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    bookingsCount: 0,
    favoritesCount: 0,
    priceAlertsCount: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Unique IDs for accessibility
  const statsHeadingId = useId();
  const recentBookingsHeadingId = useId();
  const quickActionsHeadingId = useId();
  const errorId = useId();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all data in parallel
      const [bookingsRes, favoritesRes, alertsRes] = await Promise.all([
        api.get<{ success: boolean; data: RecentBooking[] }>('/bookings'),
        api.get<{ success: boolean; data: { id: string }[] }>('/favorites'),
        api.get<{ success: boolean; data: { id: string }[] }>('/price-alerts'),
      ]);

      // Update stats
      setStats({
        bookingsCount: bookingsRes.success ? (Array.isArray(bookingsRes.data) ? bookingsRes.data.length : 0) : 0,
        favoritesCount: favoritesRes.success ? (Array.isArray(favoritesRes.data) ? favoritesRes.data.length : 0) : 0,
        priceAlertsCount: alertsRes.success ? (Array.isArray(alertsRes.data) ? alertsRes.data.length : 0) : 0,
      });

      // Get recent bookings (last 3)
      if (bookingsRes.success && Array.isArray(bookingsRes.data)) {
        setRecentBookings(bookingsRes.data.slice(0, 3));
      }

      logger.info('Dashboard data loaded successfully');
    } catch (err: unknown) {
      logger.error('Failed to fetch dashboard data', err);
      setError('Не удалось загрузить данные панели управления');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, fetchDashboardData]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Панель управления"
          aria-busy="true"
        >
          <Container>
            <div className="text-center py-12" role="status" aria-live="polite">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"
                aria-hidden="true"
              />
              <p className="mt-4 text-gray-600">Загрузка панели управления...</p>
              <span className="sr-only">Пожалуйста, подождите</span>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Navigation handlers
  const handleNavigate = useCallback((href: string) => {
    navigate(href);
  }, [navigate]);

  // Authentication guard
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Требуется авторизация"
        >
          <Container>
            <Card className="p-12 text-center" role="alert">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Требуется вход
              </h1>
              <p className="text-gray-600 mb-6">
                Для просмотра панели управления необходимо войти в аккаунт.
              </p>
              <Button onClick={() => handleNavigate('/login')}>
                Перейти к входу
              </Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  const quickLinks = useMemo(() => [
    {
      title: 'Поиск отелей',
      description: 'Найдите идеальное жильё',
      icon: HotelIcon,
      href: '/hotels',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Поиск авиабилетов',
      description: 'Забронируйте поездку',
      icon: Plane,
      href: '/flights',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Мой профиль',
      description: 'Управление данными',
      icon: User,
      href: '/profile',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Настройки',
      description: 'Параметры аккаунта',
      icon: SettingsIcon,
      href: '/settings',
      color: 'bg-orange-100 text-orange-600',
    },
  ], []);

  const statsCards = useMemo(() => [
    {
      title: 'Мои бронирования',
      count: stats.bookingsCount,
      icon: Calendar,
      href: '/bookings',
      color: 'bg-blue-600',
      description: 'Активные резервации',
    },
    {
      title: 'Избранное',
      count: stats.favoritesCount,
      icon: Heart,
      href: '/favorites',
      color: 'bg-red-600',
      description: 'Сохранённые объекты',
    },
    {
      title: 'Уведомления о ценах',
      count: stats.priceAlertsCount,
      icon: Bell,
      href: '/price-alerts',
      color: 'bg-yellow-600',
      description: 'Активные уведомления',
    },
  ], [stats.bookingsCount, stats.favoritesCount, stats.priceAlertsCount]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Панель управления"
      >
        <Container>
          {/* Welcome Section */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              С возвращением, {user.firstName}!
            </h1>
            <p className="text-gray-600 text-lg">
              Обзор ваших путешествий и бронирований
            </p>
          </header>

          {error && (
            <Card
              className="p-4 mb-6 bg-red-50 border-red-200"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
                <span id={errorId}>{error}</span>
              </div>
            </Card>
          )}

          {/* Stats Cards */}
          <section aria-labelledby={statsHeadingId} className="mb-8">
            <h2 id={statsHeadingId} className="sr-only">
              Статистика аккаунта
            </h2>
            <div className="grid md:grid-cols-3 gap-6" role="list">
              {statsCards.map((stat) => (
                <Card
                  key={stat.title}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-primary-500"
                  onClick={() => handleNavigate(stat.href)}
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNavigate(stat.href);
                    }
                  }}
                  aria-label={`${stat.title}: ${stat.count} ${stat.description}. Нажмите для перехода`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{stat.description}</p>
                    <p className="text-3xl font-bold text-gray-900" aria-live="polite">
                      {stat.count}
                    </p>
                    <p className="text-sm font-medium text-primary-600 mt-2">
                      Перейти к {stat.title.toLowerCase()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          {recentBookings.length > 0 && (
            <section aria-labelledby={recentBookingsHeadingId} className="mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 id={recentBookingsHeadingId} className="text-2xl font-bold text-gray-900">
                    Последние бронирования
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate('/bookings')}
                    aria-label="Показать все бронирования"
                  >
                    Все бронирования
                  </Button>
                </div>

                <ul className="space-y-4" role="list" aria-label="Список последних бронирований">
                  {recentBookings.map((booking) => {
                    const bookingType = booking.type === 'HOTEL' ? 'Отель' : 'Авиабилет';
                    const statusText = booking.status === 'CONFIRMED'
                      ? 'Подтверждено'
                      : booking.status === 'PENDING'
                      ? 'Ожидает подтверждения'
                      : booking.status;

                    return (
                      <li
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label={`${bookingType}: ${booking.totalPrice.toLocaleString('ru-RU')} ${booking.currency}, статус: ${statusText}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary-100 rounded-lg" aria-hidden="true">
                            {booking.type === 'HOTEL' ? (
                              <HotelIcon className="w-5 h-5 text-primary-600" />
                            ) : (
                              <Plane className="w-5 h-5 text-primary-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {bookingType}
                            </p>
                            <p className="text-sm text-gray-600">
                              <time dateTime={booking.createdAt}>
                                {new Date(booking.createdAt).toLocaleDateString('ru-RU')}
                              </time>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {booking.totalPrice.toLocaleString('ru-RU')} {booking.currency}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              booking.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            role="status"
                          >
                            {statusText}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          )}

          {/* Quick Actions */}
          <section aria-labelledby={quickActionsHeadingId}>
            <Card className="p-6">
              <h2 id={quickActionsHeadingId} className="text-2xl font-bold text-gray-900 mb-6">
                Быстрые действия
              </h2>
              <nav aria-label="Быстрые действия">
                <ul className="grid md:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
                  {quickLinks.map((link) => (
                    <li key={link.title}>
                      <button
                        onClick={() => handleNavigate(link.href)}
                        className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all text-left"
                        aria-label={`${link.title}: ${link.description}`}
                      >
                        <div className={`inline-flex p-2 rounded-lg ${link.color} mb-3`} aria-hidden="true">
                          <link.icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{link.title}</h3>
                        <p className="text-sm text-gray-600">{link.description}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </Card>
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(Dashboard);
