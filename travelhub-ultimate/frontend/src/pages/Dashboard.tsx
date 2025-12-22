import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  Calendar,
  Heart,
  Bell,
  Settings as SettingsIcon,
  User,
  TrendingUp,
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

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all data in parallel
      const [bookingsRes, favoritesRes, alertsRes] = await Promise.all([
        api.get<{ success: boolean; data: any[] }>('/bookings'),
        api.get<{ success: boolean; data: any[] }>('/favorites'),
        api.get<{ success: boolean; data: any[] }>('/price-alerts'),
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
    } catch (err: any) {
      logger.error('Failed to fetch dashboard data', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Authentication guard
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Please Log In
              </h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to view your dashboard.
              </p>
              <Button href="/login">Go to Login</Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  const quickLinks = [
    {
      title: 'Search Hotels',
      description: 'Find your perfect stay',
      icon: HotelIcon,
      href: '/hotels',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Search Flights',
      description: 'Book your next trip',
      icon: Plane,
      href: '/flights',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'My Profile',
      description: 'Manage your information',
      icon: User,
      href: '/profile',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Settings',
      description: 'Account preferences',
      icon: SettingsIcon,
      href: '/settings',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const statsCards = [
    {
      title: 'My Bookings',
      count: stats.bookingsCount,
      icon: Calendar,
      href: '/bookings',
      color: 'bg-blue-600',
      description: 'Active reservations',
    },
    {
      title: 'Favorites',
      count: stats.favoritesCount,
      icon: Heart,
      href: '/favorites',
      color: 'bg-red-600',
      description: 'Saved items',
    },
    {
      title: 'Price Alerts',
      count: stats.priceAlertsCount,
      icon: Bell,
      href: '/price-alerts',
      color: 'bg-yellow-600',
      description: 'Active alerts',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <Container>
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600 text-lg">
              Here's what's happening with your travel plans
            </p>
          </div>

          {error && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {statsCards.map((stat) => (
              <Card
                key={stat.title}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(stat.href)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.description}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-sm font-medium text-primary-600 mt-2">
                    View {stat.title}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          {recentBookings.length > 0 && (
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/bookings')}
                >
                  View All
                </Button>
              </div>

              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        {booking.type === 'HOTEL' ? (
                          <HotelIcon className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Plane className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.type} Booking
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.createdAt).toLocaleDateString('ru-RU')}
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
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link) => (
                <button
                  key={link.title}
                  onClick={() => navigate(link.href)}
                  className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-left"
                >
                  <div className={`inline-flex p-2 rounded-lg ${link.color} mb-3`}>
                    <link.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{link.title}</h3>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </button>
              ))}
            </div>
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
