import React, { useState, useEffect, useCallback, useMemo, memo, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Trash2, AlertCircle, CheckCircle, Clock, XCircle, MapPin, Calendar, Banknote, Plane, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { useAuth } from '../store/AuthContext';
import { priceAlertSchema, validateForm } from '../utils/validators';

type AlertType = 'HOTEL' | 'FLIGHT';
type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED';
type FilterType = 'ALL' | AlertType;

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

/**
 * Get status text in Russian.
 */
function getStatusText(status: AlertStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Активно';
    case 'TRIGGERED':
      return 'Сработало';
    case 'EXPIRED':
      return 'Истекло';
    case 'CANCELLED':
      return 'Отменено';
    default:
      return status;
  }
}

/**
 * PriceAlerts page - manage price alerts for hotels and flights.
 */
const PriceAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAlertData>({
    type: 'HOTEL',
    destination: '',
    targetPrice: 0,
    currency: 'RUB',
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Unique IDs for accessibility
  const headingId = useId();
  const errorId = useId();
  const filterGroupId = useId();
  const createFormId = useId();
  const deleteModalId = useId();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAlerts();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchAlerts = useCallback(async () => {
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
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to fetch price alerts', err);
      setError(apiError.response?.data?.message || 'Не удалось загрузить оповещения');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFormChange = useCallback((field: keyof CreateAlertData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formError, formErrors]);

  const handleCreateAlert = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormErrors({});

    // Validate form data
    const result = validateForm(priceAlertSchema, formData);
    if (!result.success) {
      setFormErrors(result.errors || {});
      return;
    }

    setCreating(true);

    try {
      const response = await api.post<{
        success: boolean;
        data: PriceAlert;
      }>('/price-alerts', formData);

      if (response.success && response.data) {
        setAlerts((prev) => [response.data, ...prev]);
        setShowCreateForm(false);
        setFormData({
          type: 'HOTEL',
          destination: '',
          targetPrice: 0,
          currency: 'RUB',
        });
        logger.info('Price alert created successfully');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to create price alert', err);
      setFormError(apiError.response?.data?.message || 'Не удалось создать оповещение');
    } finally {
      setCreating(false);
    }
  }, [formData]);

  const handleToggleAlert = useCallback(async (alertId: string, currentStatus: boolean) => {
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
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to toggle price alert', err);
      setError(apiError.response?.data?.message || 'Не удалось обновить оповещение');
    } finally {
      setTogglingId(null);
    }
  }, []);

  const handleOpenDeleteModal = useCallback((alertId: string) => {
    setDeleteTargetId(alertId);
    setShowDeleteModal(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  }, []);

  const handleDeleteAlert = useCallback(async () => {
    if (!deleteTargetId) return;

    try {
      setDeletingId(deleteTargetId);
      setShowDeleteModal(false);

      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/price-alerts/${deleteTargetId}`);

      if (response.success) {
        setAlerts((prev) => prev.filter((alert) => alert.id !== deleteTargetId));
        logger.info('Price alert deleted successfully');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to delete price alert', err);
      setError(apiError.response?.data?.message || 'Не удалось удалить оповещение');
    } finally {
      setDeletingId(null);
      setDeleteTargetId(null);
    }
  }, [deleteTargetId]);

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  const handleToggleCreateForm = useCallback(() => {
    setShowCreateForm(prev => !prev);
    setFormError('');
  }, []);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // Memoized filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filter === 'ALL') return true;
      return alert.type === filter;
    });
  }, [alerts, filter]);

  // Memoized counts
  const counts = useMemo(() => ({
    all: alerts.length,
    hotels: alerts.filter((a) => a.type === 'HOTEL').length,
    flights: alerts.filter((a) => a.type === 'FLIGHT').length,
  }), [alerts]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Оповещения о ценах"
          aria-busy="true"
        >
          <Container>
            <div className="text-center py-12" role="status" aria-live="polite">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"
                aria-hidden="true"
              />
              <p className="mt-4 text-gray-600">Загрузка оповещений...</p>
              <span className="sr-only">Пожалуйста, подождите</span>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Authentication guard
  if (!isAuthenticated) {
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
                Для управления оповещениями о ценах необходимо войти в аккаунт.
              </p>
              <Button onClick={handleNavigateToLogin}>
                Перейти к входу
              </Button>
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
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Оповещения о ценах"
      >
        <Container>
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-primary-600" aria-hidden="true" />
                <h1 id={headingId} className="text-3xl font-bold text-gray-900">
                  Оповещения о ценах
                </h1>
              </div>
              <Button
                onClick={handleToggleCreateForm}
                icon={showCreateForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                aria-expanded={showCreateForm}
                aria-controls={createFormId}
              >
                {showCreateForm ? 'Отмена' : 'Создать оповещение'}
              </Button>
            </div>
            <p className="text-gray-600">
              Получайте уведомления о снижении цен ({alerts.length} {getAlertCountText(alerts.length)})
            </p>
          </header>

          {/* Create Form */}
          {showCreateForm && (
            <Card id={createFormId} className="p-6 mb-6" aria-labelledby={`${createFormId}-title`}>
              <h2 id={`${createFormId}-title`} className="text-xl font-semibold text-gray-900 mb-4">
                Создать оповещение
              </h2>
              <form onSubmit={handleCreateAlert} className="space-y-4">
                {formError && (
                  <div
                    className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg"
                    role="alert"
                  >
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="alert-type"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Тип оповещения
                    </label>
                    <select
                      id="alert-type"
                      value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value as AlertType)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="HOTEL">Отель</option>
                      <option value="FLIGHT">Рейс</option>
                    </select>
                  </div>

                  <Input
                    label="Направление"
                    type="text"
                    value={formData.destination}
                    onChange={(value) => handleFormChange('destination', value)}
                    placeholder="например, Париж, Франция"
                    required
                    icon={<MapPin className="w-5 h-5" />}
                  />
                </div>

                {formData.type === 'HOTEL' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Дата заезда"
                      type="date"
                      value={formData.checkIn || ''}
                      onChange={(value) => handleFormChange('checkIn', value)}
                    />
                    <Input
                      label="Дата выезда"
                      type="date"
                      value={formData.checkOut || ''}
                      onChange={(value) => handleFormChange('checkOut', value)}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Дата вылета"
                      type="date"
                      value={formData.departDate || ''}
                      onChange={(value) => handleFormChange('departDate', value)}
                    />
                    <Input
                      label="Дата возврата"
                      type="date"
                      value={formData.returnDate || ''}
                      onChange={(value) => handleFormChange('returnDate', value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Целевая цена"
                    type="number"
                    value={String(formData.targetPrice)}
                    onChange={(value) => handleFormChange('targetPrice', parseFloat(value) || 0)}
                    placeholder="0"
                    required
                    icon={<Banknote className="w-5 h-5" />}
                  />
                  <div>
                    <label
                      htmlFor="alert-currency"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Валюта
                    </label>
                    <select
                      id="alert-currency"
                      value={formData.currency}
                      onChange={(e) => handleFormChange('currency', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="RUB">RUB (₽)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3" role="group" aria-label="Действия формы">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleCreateForm}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" loading={creating}>
                    Создать
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Filters */}
          <nav
            className="mb-6"
            role="group"
            aria-labelledby={filterGroupId}
          >
            <span id={filterGroupId} className="sr-only">
              Фильтр по типу
            </span>
            <div className="flex gap-4">
              <button
                onClick={() => handleFilterChange('ALL')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  filter === 'ALL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                aria-pressed={filter === 'ALL'}
              >
                Все ({counts.all})
              </button>
              <button
                onClick={() => handleFilterChange('HOTEL')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  filter === 'HOTEL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                aria-pressed={filter === 'HOTEL'}
              >
                Отели ({counts.hotels})
              </button>
              <button
                onClick={() => handleFilterChange('FLIGHT')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  filter === 'FLIGHT'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                aria-pressed={filter === 'FLIGHT'}
              >
                Рейсы ({counts.flights})
              </button>
            </div>
          </nav>

          {/* Error Message */}
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

          {/* Alerts List */}
          {filteredAlerts.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Оповещений пока нет
              </h2>
              <p className="text-gray-600 mb-6">
                {filter === 'ALL'
                  ? 'Создайте первое оповещение, чтобы узнавать о снижении цен!'
                  : filter === 'HOTEL'
                    ? 'У вас нет оповещений об отелях.'
                    : 'У вас нет оповещений о рейсах.'}
              </p>
              <Button onClick={handleToggleCreateForm}>
                Создать оповещение
              </Button>
            </Card>
          ) : (
            <section aria-labelledby={headingId}>
              <ul className="space-y-4" role="list" aria-label="Список оповещений">
                {filteredAlerts.map((alert) => (
                  <li key={alert.id}>
                    <AlertCard
                      alert={alert}
                      isDeleting={deletingId === alert.id}
                      isToggling={togglingId === alert.id}
                      onToggle={handleToggleAlert}
                      onDelete={handleOpenDeleteModal}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Container>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteModalId}
          >
            <Card className="max-w-md w-full p-6">
              <h3 id={deleteModalId} className="text-xl font-bold text-gray-900 mb-4">
                Удалить оповещение?
              </h3>
              <p className="text-gray-600 mb-6">
                Вы уверены, что хотите удалить это оповещение? Это действие нельзя отменить.
              </p>
              <div className="flex gap-3" role="group" aria-label="Действия диалога">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={handleCloseDeleteModal}
                >
                  Отмена
                </Button>
                <Button
                  fullWidth
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteAlert}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Удалить
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

interface AlertCardProps {
  alert: PriceAlert;
  isDeleting: boolean;
  isToggling: boolean;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

/**
 * Individual alert card component.
 */
const AlertCard = memo(function AlertCard({
  alert,
  isDeleting,
  isToggling,
  onToggle,
  onDelete,
}: AlertCardProps) {
  const handleToggle = useCallback(() => {
    onToggle(alert.id, alert.isActive);
  }, [alert.id, alert.isActive, onToggle]);

  const handleDelete = useCallback(() => {
    onDelete(alert.id);
  }, [alert.id, onDelete]);

  const getStatusIcon = (status: AlertStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4" aria-hidden="true" />;
      case 'TRIGGERED':
        return <Bell className="w-4 h-4" aria-hidden="true" />;
      case 'EXPIRED':
        return <Clock className="w-4 h-4" aria-hidden="true" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" aria-hidden="true" />;
      default:
        return <AlertCircle className="w-4 h-4" aria-hidden="true" />;
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

  return (
    <Card
      className="p-6"
      aria-label={`Оповещение: ${alert.destination}`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Alert Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(alert.status)}`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(alert.status)}
                <span>{getStatusText(alert.status)}</span>
              </div>
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
              {alert.type === 'HOTEL' ? (
                <MapPin className="w-3 h-3" aria-hidden="true" />
              ) : (
                <Plane className="w-3 h-3" aria-hidden="true" />
              )}
              {alert.type === 'HOTEL' ? 'Отель' : 'Рейс'}
            </span>
            {!alert.isActive && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                Приостановлено
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-900">
              <MapPin className="w-5 h-5 text-gray-500" aria-hidden="true" />
              <span className="font-semibold text-lg">{alert.destination}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
              {alert.type === 'HOTEL' && (
                <>
                  {alert.checkIn && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm">
                        Заезд:{' '}
                        <time dateTime={alert.checkIn}>
                          {new Date(alert.checkIn).toLocaleDateString('ru-RU')}
                        </time>
                      </span>
                    </div>
                  )}
                  {alert.checkOut && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm">
                        Выезд:{' '}
                        <time dateTime={alert.checkOut}>
                          {new Date(alert.checkOut).toLocaleDateString('ru-RU')}
                        </time>
                      </span>
                    </div>
                  )}
                </>
              )}

              {alert.type === 'FLIGHT' && (
                <>
                  {alert.departDate && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm">
                        Вылет:{' '}
                        <time dateTime={alert.departDate}>
                          {new Date(alert.departDate).toLocaleDateString('ru-RU')}
                        </time>
                      </span>
                    </div>
                  )}
                  {alert.returnDate && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm">
                        Возврат:{' '}
                        <time dateTime={alert.returnDate}>
                          {new Date(alert.returnDate).toLocaleDateString('ru-RU')}
                        </time>
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <span className="text-sm text-gray-600">Цель:</span>
                <span className="font-semibold text-primary-600">
                  {alert.targetPrice.toLocaleString('ru-RU')} {alert.currency}
                </span>
              </div>
              {alert.currentPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Текущая:</span>
                  <span className="font-semibold text-gray-900">
                    {alert.currentPrice.toLocaleString('ru-RU')} {alert.currency}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              <time dateTime={alert.createdAt}>
                Создано {new Date(alert.createdAt).toLocaleDateString('ru-RU')}
              </time>
              {alert.lastCheckedAt && (
                <>
                  {' · '}
                  <time dateTime={alert.lastCheckedAt}>
                    Проверено {new Date(alert.lastCheckedAt).toLocaleDateString('ru-RU')}
                  </time>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 md:items-end">
          <div className="flex gap-2" role="group" aria-label="Действия с оповещением">
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggle}
              loading={isToggling}
              aria-label={alert.isActive ? 'Приостановить оповещение' : 'Активировать оповещение'}
            >
              {alert.isActive ? 'Приостановить' : 'Активировать'}
            </Button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Удалить оповещение"
            >
              {isDeleting ? (
                <div
                  className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
});

/**
 * Get proper Russian plural form for alert count.
 */
function getAlertCountText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'оповещений';
  if (lastOne === 1) return 'оповещение';
  if (lastOne >= 2 && lastOne <= 4) return 'оповещения';
  return 'оповещений';
}

export default memo(PriceAlerts);
