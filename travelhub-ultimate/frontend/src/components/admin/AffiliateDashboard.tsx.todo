import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
} from 'lucide-react';
import axios from 'axios';
import Container from '../layout/Container';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { formatCurrency } from '../../utils/formatters';
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/admin/affiliate/analytics?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <Loading size="lg" text="Loading analytics..." />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card
              padding="lg"
              hover
              className="cursor-pointer"
              onClick={() => window.location.href = '/admin/affiliates'}
            >
              <Users className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Manage Affiliates
              </h3>
              <p className="text-gray-600 text-sm">
                View and manage all affiliates
              </p>
            </Card>

            <Card
              padding="lg"
              hover
              className="cursor-pointer"
              onClick={() => window.location.href = '/admin/commissions'}
            >
              <CheckCircle className="w-8 h-8 text-success-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Approve Commissions
              </h3>
              <p className="text-gray-600 text-sm">
                Review pending commissions
              </p>
            </Card>

            <Card
              padding="lg"
              hover
              className="cursor-pointer"
              onClick={() => window.location.href = '/admin/payouts'}
            >
              <CreditCard className="w-8 h-8 text-warning-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Process Payouts
              </h3>
              <p className="text-gray-600 text-sm">
                Handle payout requests
              </p>
            </Card>

            <Card
              padding="lg"
              hover
              className="cursor-pointer"
              onClick={() => window.location.href = '/admin/settings'}
            >
              <Clock className="w-8 h-8 text-secondary-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Settings
              </h3>
              <p className="text-gray-600 text-sm">
                Configure affiliate program
              </p>
            </Card>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default AdminAffiliateDashboard;
