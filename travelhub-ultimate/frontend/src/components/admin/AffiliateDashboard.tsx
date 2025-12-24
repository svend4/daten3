import React, { useEffect, useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Container from '../layout/Container';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { formatCurrency } from '../../utils/formatters';
import { api } from '../../utils/api';
import { logger } from '../../utils/logger';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  summary: {
    totalAffiliates: number;
    activeAffiliates: number;
    totalCommissions: number;
    totalPayouts: number;
    conversionRate: string;
  };
  conversionsByDay: Array<{
    date: string;
    conversions: number;
    revenue: number;
  }>;
}

const AdminAffiliateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{
        success: boolean;
        data: AnalyticsData;
      }>(`/admin/affiliate/analytics?period=${period}`);

      if (response.success) {
        setAnalytics(response.data);
        logger.info('Analytics loaded successfully');
      }
    } catch (err: unknown) {
      logger.error('Failed to load analytics', err);
      setError('Не удалось загрузить аналитику');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <Loading size="lg" text="Загрузка аналитики..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Container>
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
              <span>{error}</span>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, conversionsByDay } = analytics;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Affiliate Management
              </h1>
              <p className="text-xl text-gray-600">
                Monitor and manage your affiliate program
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2">
              {['7d', '30d', '90d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`
                    px-4 py-2 rounded-lg font-semibold transition-all
                    ${period === p
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card padding="lg" hover>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500">Total Affiliates</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {summary.totalAffiliates}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Active: {summary.activeAffiliates}
              </p>
            </Card>

            <Card padding="lg" hover>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500">Total Commissions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(summary.totalCommissions, 'USD')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </Card>

            <Card padding="lg" hover>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500">Total Payouts</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(summary.totalPayouts, 'USD')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </Card>

            <Card padding="lg" hover>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {summary.conversionRate}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary-600" />
                </div>
              </div>
            </Card>

            <Card padding="lg" hover>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500">Net Profit</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(summary.totalCommissions - summary.totalPayouts, 'USD')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-error-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <Card padding="lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Revenue Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={conversionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Conversions Chart */}
            <Card padding="lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Conversions Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversions" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6" role="list" aria-label="Быстрые действия">
            <Card
              padding="lg"
              hover
              className="cursor-pointer"
              onClick={() => navigate('/admin/affiliates')}
              role="listitem"
            >
              <Users className="w-8 h-8 text-primary-600 mb-3" aria-hidden="true" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Управление партнёрами
              </h3>
              <p className="text-gray-600 text-sm">
                Просмотр и управление партнёрами
              </p>
            </Card>

            <Card
              padding="lg"
              hover
              className="cursor-pointer"
              onClick={() => navigate('/admin/commissions')}
              role="listitem"
            >
              <CheckCircle className="w-8 h-8 text-success-600 mb-3" aria-hidden="true" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Одобрение комиссий
              </h3>
              <p className="text-gray-600 text-sm">
                Проверка ожидающих комиссий
              </p>
            </Card>

            <Card
              padding="lg"
              hover
              className="cursor-pointer"
              onClick={() => navigate('/admin/payouts')}
              role="listitem"
            >
              <CreditCard className="w-8 h-8 text-warning-600 mb-3" aria-hidden="true" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Обработка выплат
              </h3>
              <p className="text-gray-600 text-sm">
                Обработка запросов на выплату
              </p>
            </Card>

            <Card
              padding="lg"
              hover
              className="cursor-pointer"
              onClick={() => navigate('/admin/settings')}
              role="listitem"
            >
              <Clock className="w-8 h-8 text-secondary-600 mb-3" aria-hidden="true" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Настройки
              </h3>
              <p className="text-gray-600 text-sm">
                Настройка партнёрской программы
              </p>
            </Card>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default memo(AdminAffiliateDashboard);
