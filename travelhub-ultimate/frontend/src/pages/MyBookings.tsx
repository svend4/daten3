import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, CreditCard, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { useAuth } from '../store/AuthContext';

interface Booking {
  id: string;
  userId: string;
  hotelId?: string;
  flightId?: string;
  type: 'HOTEL' | 'FLIGHT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  checkIn?: string;
  checkOut?: string;
  departureDate?: string;
  returnDate?: string;
  guests: number;
  totalPrice: number;
  currency: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  bookingReference?: string;
  createdAt: string;
  updatedAt: string;
}

const MyBookings: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'HOTEL' | 'FLIGHT'>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchBookings();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{
        success: boolean;
        data: { bookings: Booking[] };
      }>('/bookings');

      if (response.success && response.data.bookings) {
        setBookings(response.data.bookings);
      }
    } catch (err: any) {
      logger.error('Failed to fetch bookings', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingId(bookingId);

      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/bookings/${bookingId}`);

      if (response.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'CANCELLED' as const }
              : booking
          )
        );
        logger.info('Booking cancelled successfully');
      }
    } catch (err: any) {
      logger.error('Failed to cancel booking', err);
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'CANCELLED':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'ALL') return true;
    return booking.type === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your bookings...</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
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
                You need to be logged in to view your bookings.
              </p>
              <Button href="/login">Go to Login</Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Bookings
            </h1>
            <p className="text-gray-600">
              View and manage your travel bookings
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('HOTEL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'HOTEL'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Hotels ({bookings.filter((b) => b.type === 'HOTEL').length})
            </button>
            <button
              onClick={() => setFilter('FLIGHT')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'FLIGHT'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Flights ({bookings.filter((b) => b.type === 'FLIGHT').length})
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No bookings found
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'ALL'
                  ? "You haven't made any bookings yet."
                  : `You have no ${filter.toLowerCase()} bookings.`}
              </p>
              <Button href="/">Start Exploring</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </div>
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {booking.type}
                        </span>
                      </div>

                      {booking.bookingReference && (
                        <p className="text-sm text-gray-600 mb-2">
                          Reference: <span className="font-mono font-medium">{booking.bookingReference}</span>
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {booking.type === 'HOTEL' && (
                          <>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">
                                Check-in: {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">
                                Check-out: {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </>
                        )}

                        {booking.type === 'FLIGHT' && (
                          <>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">
                                Departure: {booking.departureDate ? new Date(booking.departureDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            {booking.returnDate && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">
                                  Return: {new Date(booking.returnDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">Guests: {booking.guests}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm">
                            Payment: {booking.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mt-3">
                        Booked on {new Date(booking.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">
                          {booking.currency} {booking.totalPrice.toFixed(2)}
                        </p>
                      </div>

                      {booking.status === 'CONFIRMED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          loading={cancellingId === booking.id}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Cancel Booking
                        </Button>
                      )}

                      {booking.status === 'PENDING' && (
                        <div className="text-sm text-yellow-600 font-medium">
                          Awaiting Confirmation
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default MyBookings;
