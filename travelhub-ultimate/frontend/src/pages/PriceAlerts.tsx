import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, AlertCircle, CheckCircle, Clock, XCircle, MapPin, Calendar, DollarSign } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { useAuth } from '../store/AuthContext';

type AlertType = 'HOTEL' | 'FLIGHT';
type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED';

interface PriceAlert {
  id: string;
  userId: string;
  type: AlertType;
  destination: string;
  checkIn?: string;
  checkOut?: string;
  departDate?: string;
  returnDate?: string;
  targetPrice: number;
  currency: string;
  currentPrice?: number;
  status: AlertStatus;
  isActive: boolean;
  lastCheckedAt?: string;
  lastNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateAlertData {
  type: AlertType;
  destination: string;
  checkIn?: string;
  checkOut?: string;
  departDate?: string;
  returnDate?: string;
  targetPrice: number;
  currency: string;
}

const PriceAlerts: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | AlertType>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAlertData>({
    type: 'HOTEL',
    destination: '',
    targetPrice: 0,
    currency: 'RUB',
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAlerts();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{
        success: boolean;
        data: PriceAlert[];
      }>('/price-alerts');

      if (response.success && response.data) {
        setAlerts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
      logger.error('Failed to fetch price alerts', err);
      setError(err.response?.data?.message || 'Failed to load price alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');

    try {
      const response = await api.post<{
        success: boolean;
        data: PriceAlert;
      }>('/price-alerts', formData);

      if (response.success && response.data) {
        setAlerts((prev) => [response.data, ...prev]);
        setShowCreateForm(false);
        // Reset form
        setFormData({
          type: 'HOTEL',
          destination: '',
          targetPrice: 0,
          currency: 'RUB',
        });
        logger.info('Price alert created successfully');
      }
    } catch (err: any) {
      logger.error('Failed to create price alert', err);
      setFormError(err.response?.data?.message || 'Failed to create price alert');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAlert = async (alertId: string, currentStatus: boolean) => {
    try {
      setTogglingId(alertId);

      const response = await api.patch<{
        success: boolean;
        data: PriceAlert;
      }>(`/price-alerts/${alertId}`, {
        isActive: !currentStatus,
      });

      if (response.success && response.data) {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId ? response.data : alert
          )
        );
        logger.info('Price alert toggled successfully');
      }
    } catch (err: any) {
      logger.error('Failed to toggle price alert', err);
      alert(err.response?.data?.message || 'Failed to update price alert');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Delete this price alert?')) {
      return;
    }

    try {
      setDeletingId(alertId);

      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/price-alerts/${alertId}`);

      if (response.success) {
        setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
        logger.info('Price alert deleted successfully');
      }
    } catch (err: any) {
      logger.error('Failed to delete price alert', err);
      alert(err.response?.data?.message || 'Failed to delete price alert');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: AlertStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'TRIGGERED':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'EXPIRED':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TRIGGERED':
        return 'bg-blue-100 text-blue-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'ALL') return true;
    return alert.type === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your price alerts...</p>
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
                You need to be logged in to manage price alerts.
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-primary-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Price Alerts
                </h1>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                icon={<Plus className="w-5 h-5" />}
              >
                {showCreateForm ? 'Cancel' : 'Create Alert'}
              </Button>
            </div>
            <p className="text-gray-600">
              Get notified when prices drop for your desired destinations ({alerts.length} alerts)
            </p>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Create Price Alert
              </h2>
              <form onSubmit={handleCreateAlert} className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alert Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as AlertType })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="HOTEL">Hotel</option>
                      <option value="FLIGHT">Flight</option>
                    </select>
                  </div>

                  <Input
                    label="Destination"
                    type="text"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    placeholder="e.g., Paris, France"
                    required
                  />
                </div>

                {formData.type === 'HOTEL' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Check-in Date"
                      type="date"
                      value={formData.checkIn || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, checkIn: e.target.value })
                      }
                    />
                    <Input
                      label="Check-out Date"
                      type="date"
                      value={formData.checkOut || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, checkOut: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Departure Date"
                      type="date"
                      value={formData.departDate || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, departDate: e.target.value })
                      }
                    />
                    <Input
                      label="Return Date"
                      type="date"
                      value={formData.returnDate || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, returnDate: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Target Price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.targetPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, targetPrice: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="RUB">RUB (₽)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={creating}>
                    Create Alert
                  </Button>
                </div>
              </form>
            </Card>
          )}

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
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('HOTEL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'HOTEL'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Hotels ({alerts.filter((a) => a.type === 'HOTEL').length})
            </button>
            <button
              onClick={() => setFilter('FLIGHT')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'FLIGHT'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Flights ({alerts.filter((a) => a.type === 'FLIGHT').length})
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

          {/* Alerts List */}
          {filteredAlerts.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No price alerts yet
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'ALL'
                  ? 'Create your first price alert to get notified when prices drop!'
                  : `You have no ${filter.toLowerCase()} price alerts.`}
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Price Alert
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Alert Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            alert.status
                          )}`}
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(alert.status)}
                            {alert.status}
                          </div>
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {alert.type}
                        </span>
                        {!alert.isActive && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-900">
                          <MapPin className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold text-lg">{alert.destination}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                          {alert.type === 'HOTEL' && (
                            <>
                              {alert.checkIn && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">
                                    Check-in: {new Date(alert.checkIn).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {alert.checkOut && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">
                                    Check-out: {new Date(alert.checkOut).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {alert.type === 'FLIGHT' && (
                            <>
                              {alert.departDate && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">
                                    Departure: {new Date(alert.departDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {alert.returnDate && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">
                                    Return: {new Date(alert.returnDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Target:</span>
                            <span className="font-semibold text-primary-600">
                              {alert.currency} {alert.targetPrice.toFixed(2)}
                            </span>
                          </div>
                          {alert.currentPrice && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Current:</span>
                              <span className="font-semibold text-gray-900">
                                {alert.currency} {alert.currentPrice.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                          Created {new Date(alert.createdAt).toLocaleDateString()}
                          {alert.lastCheckedAt && (
                            <> · Last checked {new Date(alert.lastCheckedAt).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 md:items-end">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAlert(alert.id, alert.isActive)}
                          loading={togglingId === alert.id}
                        >
                          {alert.isActive ? 'Pause' : 'Activate'}
                        </Button>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          disabled={deletingId === alert.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete alert"
                        >
                          {deletingId === alert.id ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
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

export default PriceAlerts;
