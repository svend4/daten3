import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  TrendingUp,
  MousePointer,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Container from '../layout/Container';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';
import { formatCurrency } from '../../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
  totalEarnings: number;
  totalReferrals: number;
}

const AffiliateDashboard: React.FC = () => {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/affiliate/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAffiliate(response.data.data.affiliate);
        setStats(response.data.data.stats);
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <Loading size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Container>
          <Card padding="lg" className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Become an Affiliate Partner
            </h2>
            <p className="text-gray-600 mb-6">
              Join our affiliate program and earn commission on every booking!
            </p>
            <Button variant="primary" size="lg">
              Register Now
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  const baseUrl = window.location.origin;
  const referralLinks = {
    general: `${baseUrl}?ref=${affiliate.referralCode}`,
    flights: `${baseUrl}/flights?ref=${affiliate.referralCode}`,
    hotels: `${baseUrl}/hotels?ref=${affiliate.referralCode}`,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Affiliate Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Your Referral Code: <span className="font-mono font-bold text-primary-600">{affiliate.referralCode}</span>
              </span>
              <span className={`
                px-3 py-1 rounded-full text-sm font-semibold
                ${affiliate.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}
              `}>
                {affiliate.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card padding="lg" hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats.earnings.total, 'USD')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success-600" />
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold">{formatCurrency(stats.earnings.pending, 'USD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved:</span>
                    <span className="font-semibold text-success-600">{formatCurrency(stats.earnings.approved, 'USD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-semibold">{formatCurrency(stats.earnings.paid, 'USD')}</span>
                  </div>
                </div>
              </Card>

              <Card padding="lg" hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Referrals</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalReferrals}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Direct: {stats.directReferrals}
                </p>
              </Card>

              <Card padding="lg" hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Clicks</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.clicks}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                    <MousePointer className="w-6 h-6 text-secondary-600" />
                  </div>
                </div>
              </Card>

              <Card padding="lg" hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.conversionRate}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-warning-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  {stats.conversions} conversions
                </p>
              </Card>
            </div>
          )}

          {/* Referral Links */}
          <Card padding="lg" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Referral Links
            </h2>
            <div className="space-y-3">
              {Object.entries(referralLinks).map(([label, url]) => (
                <div key={label} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={url}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(url, label)}
                    icon={copiedLink === label ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  >
                    {copiedLink === label ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => window.open(url, '_blank')}
                    icon={<ExternalLink className="w-5 h-5" />}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="lg" hover className="cursor-pointer" onClick={() => window.location.href = '/affiliate/earnings'}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                View Earnings
              </h3>
              <p className="text-gray-600">
                See detailed breakdown of your commissions and earnings
              </p>
            </Card>

            <Card padding="lg" hover className="cursor-pointer" onClick={() => window.location.href = '/affiliate/referrals'}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Referral Network
              </h3>
              <p className="text-gray-600">
                View your complete referral tree and sub-affiliates
              </p>
            </Card>

            <Card padding="lg" hover className="cursor-pointer" onClick={() => window.location.href = '/affiliate/payouts'}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Request Payout
              </h3>
              <p className="text-gray-600">
                Withdraw your approved earnings to your account
              </p>
            </Card>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default AffiliateDashboard;
