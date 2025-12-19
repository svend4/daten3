import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plane, Hotel, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useBookings } from '@hooks/useBookings';
import Container from '@components/layout/Container/Container';
import Card from '@components/common/Card/Card';
import Badge from '@components/common/Badge/Badge';
import Button from '@components/common/Button/Button';
import Loading from '@components/common/Loading/Loading';
import { formatDate, formatCurrency } from '@utils/formatters';

const Bookings: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { bookings, loading, cancelBooking } = useBookings(undefined, statusFilter);

  const statusConfig = {
    pending: { icon: Clock, color: 'warning', label: 'Pending' },
    confirmed: { icon: CheckCircle, color: 'success', label: 'Confirmed' },
    cancelled: { icon: XCircle, color: 'error', label: 'Cancelled' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <Loading size="lg" text="Loading bookings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-xl text-gray-600">
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status === 'all' ? undefined : status)}
                className={`
                  px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                  ${statusFilter === (status === 'all' ? undefined : status)
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Empty State */}
          {bookings.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-600 mb-6">
                Your bookings will appear here once you make a reservation
              </p>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/'}
              >
                Start Searching
              </Button>
            </div>
          )}

          {/* Bookings List */}
          <div className="space-y-4">
            {bookings.map((booking) => {
              const StatusIcon = statusConfig[booking.status as keyof typeof statusConfig]?.icon;
              
              return (
                <Card key={booking.id} padding="lg" hover>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                        {booking.type === 'flight' ? (
                          <Plane className="w-8 h-8 text-primary-600" />
                        ) : (
                          <Hotel className="w-8 h-8 text-primary-600" />
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {booking.type === 'flight'
                              ? `${booking.itemData.route.origin} → ${booking.itemData.route.destination}`
                              : booking.itemData.name
                            }
                          </h3>
                          <p className="text-gray-600">
                            Booked on {formatDate(booking.bookingDate)}
                          </p>
                        </div>

                        <Badge
                          variant={statusConfig[booking.status as keyof typeof statusConfig]?.color as any}
                        >
                          {StatusIcon && <StatusIcon className="w-4 h-4 mr-1 inline" />}
                          {statusConfig[booking.status as keyof typeof statusConfig]?.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Travel Date</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(booking.travelDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Price</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(booking.totalPrice, booking.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Booking ID</p>
                          <p className="font-mono text-sm text-gray-700">
                            {booking.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {booking.status === 'confirmed' && (
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this booking?')) {
                                cancelBooking(booking.id);
                              }
                            }}
                          >
                            Cancel Booking
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default Bookings;
