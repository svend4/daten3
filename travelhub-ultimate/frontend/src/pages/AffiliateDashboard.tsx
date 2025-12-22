import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  MousePointer,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  UserPlus,
  ArrowRight,
  Settings,
  Wallet,
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

interface AffiliateStats {
  clicks: number;
  conversions: number;
  conversionRate: string;
  directReferrals: number;
  totalReferrals: number;
  earnings: {
    pending: number;
    approved: number;
    paid: number;
    total: number;
  };
}

interface AffiliateData {
  id: string;
  referralCode: string;
  level: number;
  status: string;
  verified: boolean;
  totalEarnings: number;
  totalReferrals: number;
  totalClicks: number;
}

interface ReferralLink {
  type: string;
  url: string;
  description: string;
}

const AffiliateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

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

      // Fetch dashboard data
      const response = await api.get<{
        success: boolean;
        data: {
          affiliate: AffiliateData;
          stats: AffiliateStats;
        };
      }>('/affiliate/dashboard');

      if (response.success && response.data) {
        setAffiliate(response.data.affiliate);
        setStats(response.data.stats);

        // Fetch referral links
        await fetchReferralLinks();

        logger.info('Affiliate dashboard loaded successfully');
      }
    } catch (err: any) {
      // If 404, user is not registered as affiliate
      if (err.response?.status === 404) {
        setAffiliate(null);
      } else {
        logger.error('Failed to fetch affiliate dashboard', err);
        setError(err.response?.data?.message || 'Failed to load affiliate data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralLinks = async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          referralCode: string;
          links: ReferralLink[];
        };
      }>('/affiliate/links');

      if (response.success && response.data) {
        setReferralLinks(response.data.links);
      }
    } catch (err: any) {
      logger.error('Failed to fetch referral links', err);
    }
  };

  const handleRegisterAsAffiliate = async () => {
    setRegistering(true);
    setError('');

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          id: string;
          referralCode: string;
          status: string;
          level: number;
          verified: boolean;
        };
      }>('/affiliate/register', {});

      if (response.success) {
        // Refresh dashboard data
        await fetchDashboardData();
        logger.info('Registered as affiliate successfully');
      } else {
        setError(response.message || 'Failed to register');
      }
    } catch (err: any) {
      logger.error('Failed to register as affiliate', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const formatCurrency = (amount: number, currency: string = 'RUB'): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
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
              <p className="mt-4 text-gray-600">Loading affiliate dashboard...</p>
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
                You need to be logged in to access the affiliate program.
              </p>
              <Button href="/login">Go to Login</Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Not registered as affiliate
  if (!affiliate) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <div className="max-w-4xl mx-auto">
              <Card className="p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                    <UserPlus className="w-10 h-10 text-primary-600" />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Become an Affiliate Partner
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    Join our affiliate program and earn commission on every booking made through your referral links!
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

                {/* Benefits */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <DollarSign className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">Earn Commission</h3>
                    <p className="text-sm text-gray-700">
                      Get 5-10% commission on every booking made by your referrals
                    </p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <Users className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">Build Your Network</h3>
                    <p className="text-sm text-gray-700">
                      Create a multi-level referral network and earn from sub-affiliates
                    </p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">Track Performance</h3>
                    <p className="text-sm text-gray-700">
                      Real-time analytics and detailed reporting dashboard
                    </p>
                  </Card>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={handleRegisterAsAffiliate}
                    loading={registering}
                    icon={<UserPlus className="w-5 h-5" />}
                  >
                    {registering ? 'Registering...' : 'Register as Affiliate'}
                  </Button>
                  <p className="text-sm text-gray-600 mt-4">
                    Registration is free and takes less than a minute
                  </p>
                </div>
              </Card>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Affiliate dashboard
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Affiliate Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Referral Code:{' '}
                <span className="font-mono font-bold text-primary-600">{affiliate.referralCode}</span>
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  affiliate.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : affiliate.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {affiliate.status.toUpperCase()}
              </span>
              {affiliate.verified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              )}
            </div>
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
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats.earnings.total)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Pending:</span>
                    <span className="font-medium">{formatCurrency(stats.earnings.pending)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Approved:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(stats.earnings.approved)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Paid:</span>
                    <span className="font-medium">{formatCurrency(stats.earnings.paid)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Direct referrals: <span className="font-medium">{stats.directReferrals}</span>
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Clicks</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.clicks}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MousePointer className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {stats.conversions} conversions
                </p>
              </Card>
            </div>
          )}

          {/* Referral Links */}
          {referralLinks.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Referral Links</h2>
              <div className="space-y-3">
                {referralLinks.map((link) => (
                  <div key={link.type} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {link.description}
                      </label>
                      <input
                        type="text"
                        value={link.url}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                    <div className="flex gap-2 pt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.url, link.type)}
                        icon={
                          copiedLink === link.type ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )
                        }
                      >
                        {copiedLink === link.type ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                        icon={<ExternalLink className="w-4 h-4" />}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/affiliate/referrals')}
            >
              <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 text-primary-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Referral Network</h3>
              <p className="text-gray-600 text-sm">
                View your complete referral tree and sub-affiliates
              </p>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/affiliate/payouts')}
            >
              <div className="flex items-center justify-between mb-3">
                <Wallet className="w-8 h-8 text-green-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Payouts</h3>
              <p className="text-gray-600 text-sm">
                View payout history and request withdrawals
              </p>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/affiliate/portal')}
            >
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Performance Stats</h3>
              <p className="text-gray-600 text-sm">
                Detailed analytics and monthly earnings reports
              </p>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/affiliate/settings')}
            >
              <div className="flex items-center justify-between mb-3">
                <Settings className="w-8 h-8 text-purple-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600 text-sm">
                Configure payment details and notifications
              </p>
            </Card>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default AffiliateDashboard;
