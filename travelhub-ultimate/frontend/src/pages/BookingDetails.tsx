import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CreditCard,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Hotel as HotelIcon,
  Plane,
  ArrowLeft,
  Download,
  Mail,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface Booking {
  id: string;
  type: 'HOTEL' | 'FLIGHT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookingReference: string;
  itemId: string;
  itemDetails?: {
    name?: string;
    location?: string;
    imageUrl?: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      fetchBookingDetails();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{
        success: boolean;
        data: { booking: Booking };
      }>(`/bookings/${id}`);

      if (response.success && response.data.booking) {
        setBooking(response.data.booking);
        logger.info('Booking details loaded', { bookingId: id });
      } else {
        setError('Booking not found');
      }
    } catch (err: any) {
      logger.error('Failed to fetch booking details', err);
      setError(err.response?.data?.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancelling(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/bookings/${booking.id}`);

      if (response.success) {
        setSuccess('Booking cancelled successfully');
        // Refresh booking details
        await fetchBookingDetails();
        logger.info('Booking cancelled', { bookingId: booking.id });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to cancel booking');
      }
    } catch (err: any) {
      logger.error('Failed to cancel booking', err);
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5" />;
      case 'PENDING':
        return <Clock className="w-5 h-5" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5" />;
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
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
              <p className="mt-4 text-gray-600">Loading booking details...</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to view booking details.
              </p>
              <Button href="/login">Go to Login</Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error && !booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => navigate('/bookings')}>Back to My Bookings</Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <Container>
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/bookings')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to My Bookings
            </Button>
          </div>

          {/* Success Message */}
          {success && (
            <Card className="p-4 mb-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Details</h1>
                <p className="text-gray-600 text-lg">
                  Reference: <span className="font-mono font-semibold">{booking.bookingReference}</span>
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="font-semibold">{booking.status}</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Item Details */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  {booking.type === 'HOTEL' ? (
                    <HotelIcon className="w-6 h-6 text-primary-600" />
                  ) : (
                    <Plane className="w-6 h-6 text-primary-600" />
                  )}
                  <h2 className="text-2xl font-bold text-gray-900">
                    {booking.type === 'HOTEL' ? 'Hotel Details' : 'Flight Details'}
                  </h2>
                </div>

                {booking.itemDetails?.imageUrl && (
                  <div className="mb-6 rounded-lg overflow-hidden">
                    <img
                      src={booking.itemDetails.imageUrl}
                      alt={booking.itemDetails.name || 'Booking'}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  {booking.itemDetails?.name && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.itemDetails.name}
                      </h3>
                    </div>
                  )}
                  {booking.itemDetails?.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-5 h-5" />
                      <span>{booking.itemDetails.location}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Booking Information */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Check-in</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {new Date(booking.checkIn).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Check-out</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {new Date(booking.checkOut).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {nights} {nights === 1 ? 'night' : 'nights'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Guests</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                      </p>
                    </div>

                    {booking.rooms && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <HotelIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">Rooms</span>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {booking.rooms} {booking.rooms === 1 ? 'room' : 'rooms'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Payment Information */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-gray-600">Payment Method</span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 capitalize">
                        {booking.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-gray-600">Payment Status</span>
                    <span className="font-medium text-gray-900 capitalize">{booking.paymentStatus}</span>
                  </div>

                  <div className="flex items-center justify-between text-lg pt-2">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="font-bold text-primary-600">
                      {booking.totalPrice.toLocaleString('en-US')} {booking.currency}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions Card */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button
                    fullWidth
                    variant="outline"
                    icon={<Download className="w-4 h-4" />}
                    disabled
                  >
                    Download Invoice
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    icon={<Mail className="w-4 h-4" />}
                    disabled
                  >
                    Email Confirmation
                  </Button>
                  {booking.status === 'CONFIRMED' && (
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={handleCancelBooking}
                      loading={cancelling}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </Button>
                  )}
                </div>
              </Card>

              {/* Booking Metadata */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Booking ID</span>
                    <p className="font-mono text-gray-900 mt-1">{booking.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Created</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(booking.createdAt).toLocaleString('en-US')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(booking.updatedAt).toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Help Card */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Need Help?</h3>
                <p className="text-sm text-blue-800 mb-4">
                  If you have any questions about your booking, our support team is here to help.
                </p>
                <Button
                  fullWidth
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/support')}
                  className="border-blue-600 text-blue-600 hover:bg-blue-100"
                >
                  Contact Support
                </Button>
              </Card>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default BookingDetails;
