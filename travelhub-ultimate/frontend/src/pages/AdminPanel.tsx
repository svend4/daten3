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

type TabType = 'dashboard' | 'affiliates' | 'commissions' | 'payouts' | 'analytics';

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
    const response = await api.get<{
      success: boolean;
      data: AdminStats;
    }>('/admin/analytics');

    if (response.success && response.data) {
      setStats(response.data);
      logger.info('Admin analytics loaded');
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
                            <div className="flex gap-2">
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
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPanel;
