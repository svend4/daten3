import React, { useState, useEffect, useCallback, memo } from 'react';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}
import {
  Users,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Calendar,
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

interface ReferralUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Referral {
  id: string;
  level: number;
  status: string;
  verified: boolean;
  totalEarnings: number;
  directReferrals: number;
  createdAt: string;
  user: ReferralUser;
  referrals?: Referral[];
}

interface ReferralStats {
  totalReferrals: number;
  directReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  averageEarningsPerReferral: number;
}

const AffiliateReferrals: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [referralTree, setReferralTree] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchReferralData();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch referral tree
      const response = await api.get<{
        success: boolean;
        data: {
          tree: Referral[];
          stats: ReferralStats;
        };
      }>('/affiliate/referral-tree');

      if (response.success && response.data) {
        setReferralTree(response.data.tree || []);
        setStats(response.data.stats || null);
        logger.info('Referral tree loaded successfully');
      } else {
        setError('Failed to load referral data');
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      logger.error('Failed to fetch referral tree', err);

      // Handle specific error cases
      if (apiError.response?.status === 404) {
        setError('Вы не зарегистрированы как партнёр. Сначала зарегистрируйтесь.');
      } else if (apiError.response?.status === 403) {
        setError('У вас нет прав для просмотра рефералов.');
      } else {
        setError(apiError.response?.data?.message || 'Не удалось загрузить данные рефералов');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getUserName = (user: ReferralUser): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email.split('@')[0];
  };

  // Render individual referral node
  const ReferralNode: React.FC<{ referral: Referral; depth?: number }> = ({
    referral,
    depth = 0,
  }) => {
    const hasChildren = referral.referrals && referral.referrals.length > 0;
    const isExpanded = expandedNodes.has(referral.id);
    const userName = getUserName(referral.user);

    // Level-based styling
    const getLevelColor = (level: number): string => {
      const colors = [
        'border-blue-500 bg-blue-50',
        'border-green-500 bg-green-50',
        'border-purple-500 bg-purple-50',
        'border-orange-500 bg-orange-50',
      ];
      return colors[Math.min(level - 1, colors.length - 1)] || 'border-gray-300 bg-gray-50';
    };

    return (
      <div className={depth > 0 ? 'ml-8 mt-3' : 'mt-3'}>
        <Card className={`border-l-4 ${getLevelColor(referral.level)} hover:shadow-md transition-shadow`}>
          <div className="p-4">
            <div className="flex items-start justify-between">
              {/* User info */}
              <div className="flex items-start gap-3 flex-1">
                {/* Expand/collapse button */}
                {hasChildren && (
                  <button
                    onClick={() => toggleNode(referral.id)}
                    className="flex-shrink-0 mt-1 p-1 hover:bg-gray-200 rounded transition-colors"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                )}

                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                </div>

                {/* User details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">{userName}</p>
                    {referral.verified && (
                      <UserCheck className="w-4 h-4 text-green-600 flex-shrink-0" title="Verified" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{referral.user.email}</p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {formatDate(referral.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Level {referral.level}</span>
                    </div>
                    {referral.directReferrals > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{referral.directReferrals} referral{referral.directReferrals !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-col items-end gap-2 ml-4">
                <div className="flex items-center gap-1 text-green-700 font-semibold">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(referral.totalEarnings)}</span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    referral.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {referral.status}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Sub-referrals */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-gray-200 ml-4 pl-4">
            {referral.referrals!.map((subReferral) => (
              <ReferralNode key={subReferral.id} referral={subReferral} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
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
              <p className="mt-4 text-gray-600">Loading referral network...</p>
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
                You need to be logged in to view your referral network.
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
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Your Referral Network
                </h1>
                <p className="text-gray-600">
                  Manage and track your affiliate referrals
                </p>
              </div>
              <Button onClick={() => navigate('/affiliate')} variant="outline">
                Back to Dashboard
              </Button>
            </div>
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

          {/* Stats Overview */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Direct Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.directReferrals}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeReferrals}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Referral Tree */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Referral Tree</h2>
              {referralTree.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExpandedNodes(new Set(referralTree.map((r) => r.id)))}
                  >
                    Expand All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExpandedNodes(new Set())}
                  >
                    Collapse All
                  </Button>
                </div>
              )}
            </div>

            {referralTree.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Referrals Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start sharing your referral links to build your network!
                </p>
                <Button onClick={() => navigate('/affiliate')}>
                  Get Your Referral Links
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {referralTree.map((referral) => (
                  <ReferralNode key={referral.id} referral={referral} />
                ))}
              </div>
            )}
          </Card>

          {/* Help Card */}
          {referralTree.length > 0 && (
            <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Understanding Your Network
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Level 1</strong>: Your direct referrals</li>
                    <li>• <strong>Level 2+</strong>: Referrals made by your referrals</li>
                    <li>• Click the arrow icons to expand/collapse sub-networks</li>
                    <li>• Earnings are calculated based on the referral level and commission rate</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(AffiliateReferrals);
