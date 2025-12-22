import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Settings as SettingsIcon,
  BarChart3,
  Eye,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface AdminStats {
  overview: {
    totalAffiliates: number;
    activeAffiliates: number;
    totalEarnings: number;
    pendingPayouts: number;
    thisMonthCommissions: number;
  };
  monthly: Array<{
    month: string;
    commissions: number;
  }>;
  byLevel: {
    [key: string]: {
      count: number;
      earnings: number;
    };
  };
}

interface Affiliate {
  id: string;
  referralCode: string;
  level: number;
  status: string;
  verified: boolean;
  totalEarnings: number;
  totalReferrals: number;
  totalClicks: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  level: number;
  createdAt: string;
  approvedAt?: string;
  affiliate: {
    id: string;
    referralCode: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  transactionId?: string;
  affiliate: {
    id: string;
    referralCode: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface AffiliateDetails {
  id: string;
  referralCode: string;
  level: number;
  status: string;
  verified: boolean;
  totalEarnings: number;
  totalReferrals: number;
  totalClicks: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
  earnings: {
    pending: number;
    approved: number;
    paid: number;
    total: number;
  };
  referrals: {
    total: number;
    active: number;
    direct: number;
    indirect: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    amount?: number;
    createdAt: string;
  }>;
}

interface AdminSettings {
  commissionRates: {
    level1: number;
    level2: number;
    level3: number;
  };
  minPayoutAmount: number;
  cookieDuration: number;
  requireVerification: boolean;
}

interface TopPerformer {
  rank: number;
  affiliateId: string;
  referralCode: string;
  name: string;
  email: string;
  totalEarnings: number;
  totalReferrals: number;
  totalClicks: number;
  conversionRate: string;
}

type TabType = 'dashboard' | 'affiliates' | 'commissions' | 'payouts' | 'analytics' | 'settings';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard data
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Affiliates data
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [affiliatesPage, setAffiliatesPage] = useState(1);
  const [affiliatesTotalPages, setAffiliatesTotalPages] = useState(1);

  // Commissions data
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [commissionsTotalPages, setCommissionsTotalPages] = useState(1);

  // Payouts data
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);

  // Affiliate details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [affiliateDetails, setAffiliateDetails] = useState<AffiliateDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Settings data
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  // Top performers data
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchTabData();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, activeTab]);

  useEffect(() => {
    if (activeTab === 'affiliates') {
      fetchAffiliates();
    } else if (activeTab === 'commissions') {
      fetchCommissions();
    } else if (activeTab === 'payouts') {
      fetchPayouts();
    }
  }, [affiliatesPage, commissionsPage, payoutsPage]);

  const fetchTabData = async () => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'dashboard') {
        await fetchAnalytics();
      } else if (activeTab === 'affiliates') {
        await fetchAffiliates();
      } else if (activeTab === 'commissions') {
        await fetchCommissions();
      } else if (activeTab === 'payouts') {
        await fetchPayouts();
      } else if (activeTab === 'analytics') {
        await fetchAnalytics();
      } else if (activeTab === 'settings') {
        await fetchSettings();
      }
    } catch (err: any) {
      logger.error('Failed to fetch admin data', err);
      if (err.response?.status === 403) {
        setError('You do not have admin permissions.');
      } else {
        setError(err.response?.data?.message || 'Failed to load admin data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    const [analyticsResponse, topPerformersResponse] = await Promise.all([
      api.get<{
        success: boolean;
        data: AdminStats;
      }>('/admin/analytics'),
      api.get<{
        success: boolean;
        data: TopPerformer[];
      }>('/admin/analytics/top-performers?limit=10')
    ]);

    if (analyticsResponse.success && analyticsResponse.data) {
      setStats(analyticsResponse.data);
      logger.info('Admin analytics loaded');
    }

    if (topPerformersResponse.success && topPerformersResponse.data) {
      setTopPerformers(topPerformersResponse.data);
      logger.info('Top performers loaded');
    }
  };

  const fetchAffiliates = async () => {
    const response = await api.get<{
      success: boolean;
      data: Affiliate[];
      pagination: { pages: number };
    }>(`/admin/affiliates?page=${affiliatesPage}&limit=10`);

    if (response.success && response.data) {
      setAffiliates(response.data);
      setAffiliatesTotalPages(response.pagination.pages);
      logger.info('Affiliates loaded');
    }
  };

  const fetchCommissions = async () => {
    const response = await api.get<{
      success: boolean;
      data: Commission[];
      pagination: { pages: number };
    }>(`/admin/commissions?page=${commissionsPage}&limit=10`);

    if (response.success && response.data) {
      setCommissions(response.data);
      setCommissionsTotalPages(response.pagination.pages);
      logger.info('Commissions loaded');
    }
  };

  const fetchPayouts = async () => {
    const response = await api.get<{
      success: boolean;
      data: Payout[];
      pagination: { pages: number };
    }>(`/admin/payouts?page=${payoutsPage}&limit=10`);

    if (response.success && response.data) {
      setPayouts(response.data);
      setPayoutsTotalPages(response.pagination.pages);
      logger.info('Payouts loaded');
    }
  };

  const fetchSettings = async () => {
    const response = await api.get<{
      success: boolean;
      data: AdminSettings;
    }>('/admin/settings');

    if (response.success && response.data) {
      setSettings(response.data);
      logger.info('Settings loaded');
    }
  };

  const handleApproveCommission = async (commissionId: string) => {
    try {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/admin/commissions/${commissionId}/approve`,
        {}
      );

      if (response.success) {
        logger.info('Commission approved');
        await fetchCommissions();
      }
    } catch (err: any) {
      logger.error('Failed to approve commission', err);
      alert(err.response?.data?.message || 'Failed to approve commission');
    }
  };

  const handleRejectCommission = async (commissionId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/admin/commissions/${commissionId}/reject`,
        { reason }
      );

      if (response.success) {
        logger.info('Commission rejected');
        await fetchCommissions();
      }
    } catch (err: any) {
      logger.error('Failed to reject commission', err);
      alert(err.response?.data?.message || 'Failed to reject commission');
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/admin/payouts/${payoutId}/process`,
        {}
      );

      if (response.success) {
        logger.info('Payout processing started');
        await fetchPayouts();
      }
    } catch (err: any) {
      logger.error('Failed to process payout', err);
      alert(err.response?.data?.message || 'Failed to process payout');
    }
  };

  const handleCompletePayout = async (payoutId: string) => {
    const transactionId = prompt('Enter transaction ID (optional):');

    try {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/admin/payouts/${payoutId}/complete`,
        { transactionId }
      );

      if (response.success) {
        logger.info('Payout completed');
        await fetchPayouts();
      }
    } catch (err: any) {
      logger.error('Failed to complete payout', err);
      alert(err.response?.data?.message || 'Failed to complete payout');
    }
  };

  const handleRejectPayout = async (payoutId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/admin/payouts/${payoutId}/reject`,
        { reason }
      );

      if (response.success) {
        logger.info('Payout rejected');
        await fetchPayouts();
      }
    } catch (err: any) {
      logger.error('Failed to reject payout', err);
      alert(err.response?.data?.message || 'Failed to reject payout');
    }
  };

  const handleVerifyAffiliate = async (affiliateId: string) => {
    if (!confirm('Verify this affiliate?')) return;

    try {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/admin/affiliates/${affiliateId}/verify`,
        {}
      );

      if (response.success) {
        logger.info('Affiliate verified');
        await fetchAffiliates();
      }
    } catch (err: any) {
      logger.error('Failed to verify affiliate', err);
      alert(err.response?.data?.message || 'Failed to verify affiliate');
    }
  };

  const handleChangeAffiliateStatus = async (affiliateId: string, newStatus: string) => {
    if (!confirm(`Change affiliate status to ${newStatus}?`)) return;

    try {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/admin/affiliates/${affiliateId}/status`,
        { status: newStatus }
      );

      if (response.success) {
        logger.info('Affiliate status updated');
        await fetchAffiliates();
      }
    } catch (err: any) {
      logger.error('Failed to update affiliate status', err);
      alert(err.response?.data?.message || 'Failed to update affiliate status');
    }
  };

  const handleViewAffiliateDetails = async (affiliateId: string) => {
    setLoadingDetails(true);
    setShowDetailsModal(true);
    setAffiliateDetails(null);

    try {
      const response = await api.get<{
        success: boolean;
        data: AffiliateDetails;
      }>(`/admin/affiliates/${affiliateId}`);

      if (response.success && response.data) {
        setAffiliateDetails(response.data);
        logger.info('Affiliate details loaded');
      }
    } catch (err: any) {
      logger.error('Failed to load affiliate details', err);
      alert(err.response?.data?.message || 'Failed to load affiliate details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      suspended: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle },
      banned: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      paid: { bg: 'bg-purple-100', text: 'text-purple-800', icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
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
              <p className="mt-4 text-gray-600">Loading admin panel...</p>
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
              <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
              <p className="text-gray-600 mb-6">
                You need admin permissions to access this panel.
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow py-8">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <p className="text-gray-600">Manage affiliate program and platform operations</p>
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

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </div>
              </button>
              <button
                onClick={() => setActiveTab('affiliates')}
                className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'affiliates'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Affiliates
                </div>
              </button>
              <button
                onClick={() => setActiveTab('commissions')}
                className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'commissions'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Commissions
                </div>
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'payouts'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Payouts
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </div>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </div>
              </button>
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Affiliates</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.overview.totalAffiliates}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.overview.activeAffiliates}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.overview.totalEarnings)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending Payouts</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.overview.pendingPayouts)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.overview.thisMonthCommissions)}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Level Distribution */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Affiliates by Level</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(stats.byLevel).map(([level, data]) => (
                    <div key={level} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1 capitalize">{level.replace('level', 'Level ')}</p>
                      <p className="text-xl font-bold text-gray-900">{data.count} affiliates</p>
                      <p className="text-sm text-green-600">{formatCurrency(data.earnings)} earned</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Affiliates Tab */}
          {activeTab === 'affiliates' && (
            <div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {affiliates.map((affiliate) => (
                        <tr key={affiliate.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {affiliate.user.firstName} {affiliate.user.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{affiliate.user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="px-2 py-1 bg-gray-100 rounded text-sm">{affiliate.referralCode}</code>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-900">Level {affiliate.level}</span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(affiliate.status)}</td>
                          <td className="px-6 py-4">
                            <span className="text-gray-900">{affiliate.totalReferrals}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(affiliate.totalEarnings)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{formatDate(affiliate.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewAffiliateDetails(affiliate.id)}
                                icon={<Eye className="w-3 h-3" />}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                Details
                              </Button>
                              {!affiliate.verified && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerifyAffiliate(affiliate.id)}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  Verify
                                </Button>
                              )}
                              {affiliate.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleChangeAffiliateStatus(affiliate.id, 'active')}
                                >
                                  Activate
                                </Button>
                              )}
                              {affiliate.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleChangeAffiliateStatus(affiliate.id, 'suspended')}
                                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                >
                                  Suspend
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAffiliatesPage((p) => Math.max(1, p - 1))}
                    disabled={affiliatesPage === 1}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {affiliatesPage} of {affiliatesTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAffiliatesPage((p) => Math.min(affiliatesTotalPages, p + 1))}
                    disabled={affiliatesPage === affiliatesTotalPages}
                    icon={<ChevronRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {commissions.map((commission) => (
                        <tr key={commission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {commission.affiliate.user.firstName} {commission.affiliate.user.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{commission.affiliate.referralCode}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(commission.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-900">Level {commission.level}</span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(commission.status)}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{formatDate(commission.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            {commission.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveCommission(commission.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectCommission(commission.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommissionsPage((p) => Math.max(1, p - 1))}
                    disabled={commissionsPage === 1}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {commissionsPage} of {commissionsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommissionsPage((p) => Math.min(commissionsTotalPages, p + 1))}
                    disabled={commissionsPage === commissionsTotalPages}
                    icon={<ChevronRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {payout.affiliate.user.firstName} {payout.affiliate.user.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{payout.affiliate.user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(payout.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(payout.status)}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{formatDate(payout.requestedAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            {payout.transactionId ? (
                              <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {payout.transactionId}
                              </code>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {payout.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessPayout(payout.id)}
                                  >
                                    Process
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectPayout(payout.id)}
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {payout.status === 'processing' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleCompletePayout(payout.id)}
                                  >
                                    Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectPayout(payout.id)}
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPayoutsPage((p) => Math.max(1, p - 1))}
                    disabled={payoutsPage === 1}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {payoutsPage} of {payoutsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPayoutsPage((p) => Math.min(payoutsTotalPages, p + 1))}
                    disabled={payoutsPage === payoutsTotalPages}
                    icon={<ChevronRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <SettingsIcon className="w-6 h-6 text-primary-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Affiliate Program Settings</h2>
                    <p className="text-sm text-gray-600">Configure commission rates and program parameters</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Environment Configuration</p>
                      <p>
                        These settings are currently managed via environment variables. To modify them, update the
                        corresponding environment variables and restart the server.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commission Rates */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Commission Rates
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-blue-700">Level 1 (Direct)</p>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">AFFILIATE_COMMISSION_LEVEL1</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{settings.commissionRates.level1}%</p>
                      <p className="text-xs text-blue-700 mt-2">Commission for direct referrals</p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-700">Level 2 (Indirect)</p>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">AFFILIATE_COMMISSION_LEVEL2</span>
                      </div>
                      <p className="text-3xl font-bold text-green-900">{settings.commissionRates.level2}%</p>
                      <p className="text-xs text-green-700 mt-2">Commission for level 2 referrals</p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-purple-700">Level 3+</p>
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">AFFILIATE_COMMISSION_LEVEL3</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-900">{settings.commissionRates.level3}%</p>
                      <p className="text-xs text-purple-700 mt-2">Commission for level 3+ referrals</p>
                    </div>
                  </div>
                </div>

                {/* Program Parameters */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Program Parameters
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Minimum Payout</p>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">AFFILIATE_MIN_PAYOUT</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{formatCurrency(settings.minPayoutAmount)}</p>
                      <p className="text-xs text-gray-600 mt-2">Minimum amount required for payout requests</p>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Cookie Duration</p>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">AFFILIATE_COOKIE_DURATION</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{settings.cookieDuration}</p>
                      <p className="text-xs text-gray-600 mt-2">Days that referral cookies remain valid</p>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Require Verification</p>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">AFFILIATE_REQUIRE_VERIFICATION</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {settings.requireVerification ? (
                          <>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <span className="text-xl font-bold text-green-900">Enabled</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-8 h-8 text-red-600" />
                            <span className="text-xl font-bold text-red-900">Disabled</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Admin verification required for new affiliates</p>
                    </div>
                  </div>
                </div>

                {/* Environment Variables Reference */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-md font-bold text-gray-900 mb-3">Environment Variables Reference</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <code className="px-2 py-1 bg-white rounded border text-xs">AFFILIATE_COMMISSION_LEVEL1</code>
                      <span className="text-gray-600">Direct referral commission rate (%)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <code className="px-2 py-1 bg-white rounded border text-xs">AFFILIATE_COMMISSION_LEVEL2</code>
                      <span className="text-gray-600">Level 2 referral commission rate (%)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <code className="px-2 py-1 bg-white rounded border text-xs">AFFILIATE_COMMISSION_LEVEL3</code>
                      <span className="text-gray-600">Level 3+ referral commission rate (%)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <code className="px-2 py-1 bg-white rounded border text-xs">AFFILIATE_MIN_PAYOUT</code>
                      <span className="text-gray-600">Minimum payout amount (USD)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <code className="px-2 py-1 bg-white rounded border text-xs">AFFILIATE_COOKIE_DURATION</code>
                      <span className="text-gray-600">Cookie duration (days)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <code className="px-2 py-1 bg-white rounded border text-xs">AFFILIATE_REQUIRE_VERIFICATION</code>
                      <span className="text-gray-600">Require verification (true/false)</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && stats && (
            <div className="space-y-6">
              {/* Monthly Commissions Chart */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Commissions (Last 6 Months)</h2>
                <div className="space-y-3">
                  {stats.monthly.map((month) => (
                    <div key={month.month} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-24">{month.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-primary-600 h-full rounded-full flex items-center justify-end pr-3 text-white text-sm font-medium"
                          style={{
                            width: `${Math.min(100, (month.commissions / (stats.overview.totalEarnings / 6)) * 100)}%`,
                          }}
                        >
                          {month.commissions > 0 && formatCurrency(month.commissions)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Performers Leaderboard */}
              {topPerformers.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-6 h-6 text-yellow-600" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Top Performing Affiliates</h2>
                      <p className="text-sm text-gray-600">Top 10 affiliates by total earnings</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {topPerformers.map((performer) => (
                          <tr key={performer.affiliateId} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold text-sm">
                                {performer.rank === 1 && '🥇'}
                                {performer.rank === 2 && '🥈'}
                                {performer.rank === 3 && '🥉'}
                                {performer.rank > 3 && `#${performer.rank}`}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-medium text-gray-900">{performer.name}</p>
                                <p className="text-sm text-gray-600">{performer.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                                {performer.referralCode}
                              </code>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-bold text-green-600 text-lg">
                                {formatCurrency(performer.totalEarnings)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-semibold text-gray-900">{performer.totalReferrals}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-900">{performer.totalClicks}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                {performer.conversionRate}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewAffiliateDetails(performer.affiliateId)}
                                icon={<Eye className="w-3 h-3" />}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Top 3 Podium Visualization */}
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    {topPerformers.slice(0, 3).map((performer, index) => (
                      <div
                        key={performer.affiliateId}
                        className={`p-4 rounded-lg text-center ${
                          index === 0
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 transform -translate-y-2'
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                            : 'bg-gradient-to-br from-orange-400 to-orange-600'
                        }`}
                      >
                        <div className="text-4xl mb-2">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <p className="font-bold text-white text-lg mb-1">{performer.name}</p>
                        <p className="text-white text-2xl font-bold">
                          {formatCurrency(performer.totalEarnings)}
                        </p>
                        <p className="text-white text-sm opacity-90 mt-1">
                          {performer.totalReferrals} referrals
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </Container>

        {/* Affiliate Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Affiliate Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading affiliate details...</p>
                </div>
              ) : affiliateDetails ? (
                <div className="p-6 space-y-6">
                  {/* User Information */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      User Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Full Name</p>
                        <p className="font-semibold text-gray-900">
                          {affiliateDetails.user.firstName} {affiliateDetails.user.lastName}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="font-semibold text-gray-900">{affiliateDetails.user.email}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Referral Code</p>
                        <code className="text-sm font-mono bg-white px-3 py-1 rounded border">
                          {affiliateDetails.referralCode}
                        </code>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Status</p>
                        <div className="flex gap-2 items-center">
                          {getStatusBadge(affiliateDetails.status)}
                          {affiliateDetails.verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Statistics
                    </h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <p className="text-sm text-blue-700 mb-1">Level</p>
                        <p className="text-2xl font-bold text-blue-900">Level {affiliateDetails.level}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <p className="text-sm text-green-700 mb-1">Total Clicks</p>
                        <p className="text-2xl font-bold text-green-900">{affiliateDetails.totalClicks}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <p className="text-sm text-purple-700 mb-1">Total Referrals</p>
                        <p className="text-2xl font-bold text-purple-900">{affiliateDetails.totalReferrals}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                        <p className="text-sm text-orange-700 mb-1">Conversion Rate</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {affiliateDetails.conversionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Earnings Breakdown
                    </h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-700 mb-1">Pending</p>
                        <p className="text-xl font-bold text-yellow-900">
                          {formatCurrency(affiliateDetails.earnings.pending)}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700 mb-1">Approved</p>
                        <p className="text-xl font-bold text-green-900">
                          {formatCurrency(affiliateDetails.earnings.approved)}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-700 mb-1">Paid Out</p>
                        <p className="text-xl font-bold text-purple-900">
                          {formatCurrency(affiliateDetails.earnings.paid)}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 mb-1">Total Earnings</p>
                        <p className="text-xl font-bold text-blue-900">
                          {formatCurrency(affiliateDetails.earnings.total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Referrals Overview */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Referrals Overview
                    </h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                        <p className="text-2xl font-bold text-gray-900">{affiliateDetails.referrals.total}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700 mb-1">Active</p>
                        <p className="text-2xl font-bold text-green-900">{affiliateDetails.referrals.active}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700 mb-1">Direct</p>
                        <p className="text-2xl font-bold text-blue-900">{affiliateDetails.referrals.direct}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-700 mb-1">Indirect</p>
                        <p className="text-2xl font-bold text-purple-900">{affiliateDetails.referrals.indirect}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {affiliateDetails.recentActivity && affiliateDetails.recentActivity.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent Activity
                      </h3>
                      <div className="space-y-2">
                        {affiliateDetails.recentActivity.slice(0, 5).map((activity) => (
                          <div
                            key={activity.id}
                            className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{activity.description}</p>
                              <p className="text-sm text-gray-600">{formatDate(activity.createdAt)}</p>
                            </div>
                            {activity.amount && (
                              <span className="font-semibold text-green-600">
                                {formatCurrency(activity.amount)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Metadata
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Joined Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(affiliateDetails.createdAt)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                        <p className="font-semibold text-gray-900">{formatDate(affiliateDetails.updatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    {!affiliateDetails.verified && (
                      <Button
                        onClick={() => {
                          handleVerifyAffiliate(affiliateDetails.id);
                          setShowDetailsModal(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Verify Affiliate
                      </Button>
                    )}
                    {affiliateDetails.status === 'pending' && (
                      <Button
                        onClick={() => {
                          handleChangeAffiliateStatus(affiliateDetails.id, 'active');
                          setShowDetailsModal(false);
                        }}
                      >
                        Activate Affiliate
                      </Button>
                    )}
                    {affiliateDetails.status === 'active' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleChangeAffiliateStatus(affiliateDetails.id, 'suspended');
                          setShowDetailsModal(false);
                        }}
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                      >
                        Suspend Affiliate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailsModal(false)}
                      className="ml-auto"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No details available</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminPanel;
