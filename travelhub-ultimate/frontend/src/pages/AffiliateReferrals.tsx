import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign } from 'lucide-react';
import axios from 'axios';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { formatCurrency, formatDate } from '../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface Referral {
  id: string;
  level: number;
  status: string;
  totalEarnings: number;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  referrals: Referral[];
}

const AffiliateReferrals: React.FC = () => {
  const [tree, setTree] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralTree();
  }, []);

  const fetchReferralTree = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/affiliate/referral-tree`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTree(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load referral tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const ReferralNode: React.FC<{ referral: Referral; depth?: number }> = ({ 
    referral, 
    depth = 0 
  }) => {
    const levelColors = [
      'border-primary-500 bg-primary-50',
      'border-secondary-500 bg-secondary-50',
      'border-success-500 bg-success-50',
    ];

    const colorClass = levelColors[depth] || 'border-gray-300 bg-gray-50';

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.1 }}
        className={`ml-${depth * 8}`}
      >
        <Card 
          padding="md" 
          className={`mb-3 border-l-4 ${colorClass}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{referral.user.name}</p>
                <p className="text-sm text-gray-600">{referral.user.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Level {referral.level} • Joined {formatDate(referral.createdAt)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-success-600" />
                <span className="font-bold text-gray-900">
                  {formatCurrency(referral.totalEarnings, 'USD')}
                </span>
              </div>
              <span className={`
                px-2 py-1 rounded-full text-xs font-semibold
                ${referral.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-200 text-gray-700'}
              `}>
                {referral.status}
              </span>
            </div>
          </div>
        </Card>

        {/* Sub-referrals */}
        {referral.referrals && referral.referrals.length > 0 && (
          <div className="ml-8 border-l-2 border-gray-200 pl-4">
            {referral.referrals.map((subReferral) => (
              <ReferralNode 
                key={subReferral.id} 
                referral={subReferral} 
                depth={depth + 1} 
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <Loading size="lg" text="Loading referral tree..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Your Referral Network
            </h1>
            <p className="text-xl text-gray-600">
              {tree.length} direct referral{tree.length !== 1 ? 's' : ''}
            </p>
          </div>

          {tree.length === 0 ? (
            <Card padding="lg" className="text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No referrals yet
              </h3>
              <p className="text-gray-600">
                Start sharing your referral links to build your network!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {tree.map((referral) => (
                <ReferralNode key={referral.id} referral={referral} />
              ))}
            </div>
          )}
        </motion.div>
      </Container>
    </div>
  );
};

export default AffiliateReferrals;
