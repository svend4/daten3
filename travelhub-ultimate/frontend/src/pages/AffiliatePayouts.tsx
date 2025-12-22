import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Landmark,
  Wallet,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  reason?: string;
}

const AffiliatePayouts: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Request payout modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestMethod, setRequestMethod] = useState('paypal');
  const [requesting, setRequesting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!authLoading && isAuthenticated) {
      fetchPayouts();
      fetchAvailableBalance();
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{
        success: boolean;
        data: Payout[];
      }>('/affiliate/payouts');

      if (response.success && response.data) {
        setPayouts(response.data);
        logger.info('Payouts loaded');
      }
    } catch (err: any) {
      logger.error('Failed to fetch payouts', err);
      if (err.response?.status === 404) {
        setError('You need to register as an affiliate first.');
      } else {
        setError(err.response?.data?.message || 'Failed to load payouts');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBalance = async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          stats: {
            earnings: {
              approved: number;
            };
          };
        };
      }>('/affiliate/dashboard');

      if (response.success && response.data) {
        setAvailableBalance(response.data.stats.earnings.approved);
      }
    } catch (err: any) {
      logger.error('Failed to fetch balance', err);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(requestAmount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > availableBalance) {
      setError(`Insufficient balance. Available: $${availableBalance.toFixed(2)}`);
      return;
    }

    try {
      setRequesting(true);
      setError('');

      const response = await api.post<{
        success: boolean;
        message: string;
      }>('/affiliate/payouts/request', {
        amount,
        method: requestMethod,
      });

      if (response.success) {
        setSuccess('Payout request submitted successfully!');
        setShowRequestModal(false);
        setRequestAmount('');
        setRequestMethod('paypal');
        await fetchPayouts();
        await fetchAvailableBalance();

        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      logger.error('Failed to request payout', err);
      setError(err.response?.data?.message || 'Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'processing':
        return <ArrowRight className="w-5 h-5 text-blue-600" />;
      case 'completed':
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      paid: { bg: 'bg-purple-100', text: 'text-purple-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'paypal':
        return <Wallet className="w-4 h-4" />;
      case 'bank_transfer':
        return <Landmark className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payouts...</p>
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-primary-600" />
                <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
              </div>
              <Button
                onClick={() => setShowRequestModal(true)}
                icon={<Plus className="w-4 h-4" />}
                disabled={availableBalance <= 0}
              >
                Request Payout
              </Button>
            </div>
            <p className="text-gray-600">Manage your payout requests and history</p>
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

          {/* Available Balance Card */}
          <Card className="p-6 mb-6 bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-700 mb-1">Available for Payout</p>
                <p className="text-3xl font-bold text-primary-900">
                  {formatCurrency(availableBalance)}
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  Approved commissions ready to withdraw
                </p>
              </div>
              <Wallet className="w-16 h-16 text-primary-400" />
            </div>
          </Card>

          {/* Payouts List */}
          <Card>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Payout History</h2>
            </div>

            {payouts.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payouts Yet</h3>
                <p className="text-gray-600 mb-6">
                  Request your first payout when you have approved commissions.
                </p>
                <Button
                  onClick={() => setShowRequestModal(true)}
                  disabled={availableBalance <= 0}
                >
                  Request Payout
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Transaction ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(payout.amount, payout.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(payout.method)}
                            <span className="text-sm text-gray-900 capitalize">
                              {payout.method.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(payout.status)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{formatDate(payout.requestedAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          {payout.completedAt ? (
                            <span className="text-sm text-gray-600">{formatDate(payout.completedAt)}</span>
                          ) : payout.rejectedAt ? (
                            <span className="text-sm text-red-600">{formatDate(payout.rejectedAt)}</span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Request Payout Modal */}
          {showRequestModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">Request Payout</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Available balance: {formatCurrency(availableBalance)}
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (USD)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={availableBalance}
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="Enter amount"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum payout: $50.00
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={requestMethod}
                      onChange={(e) => setRequestMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="paypal">PayPal</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Debit Card</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 border-t flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRequestModal(false);
                      setRequestAmount('');
                      setError('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRequestPayout}
                    disabled={requesting || !requestAmount}
                    className="flex-1"
                  >
                    {requesting ? 'Requesting...' : 'Request Payout'}
                  </Button>
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

export default AffiliatePayouts;
