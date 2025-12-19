import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Container from '@components/layout/Container/Container';
import Card from '@components/common/Card/Card';
import Button from '@components/common/Button/Button';
import Input from '@components/common/Input/Input';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const AffiliatePayouts: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestPayout = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (method === 'paypal' && !paypalEmail) {
      toast.error('Please enter your PayPal email');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/affiliate/payouts/request`,
        {
          amount: parseFloat(amount),
          method,
          details: {
            email: paypalEmail
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Payout request submitted successfully!');
        setAmount('');
        setPaypalEmail('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request payout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Request Payout
            </h1>
            <p className="text-xl text-gray-600">
              Withdraw your approved earnings
            </p>
          </div>

          <Card padding="lg">
            <div className="space-y-6">
              {/* Available Balance */}
              <div className="bg-success-50 border-2 border-success-200 rounded-xl p-6">
                <p className="text-sm text-success-700 mb-1">Available Balance</p>
                <p className="text-4xl font-bold text-success-900">
                  $450.00
                </p>
                <p className="text-sm text-success-600 mt-2">
                  Minimum payout: $50.00
                </p>
              </div>

              {/* Amount */}
              <Input
                label="Payout Amount"
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                icon={<DollarSign className="w-5 h-5" />}
              />

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMethod('paypal')}
                    className={`
                      flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                      ${method === 'paypal'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-semibold">PayPal</span>
                  </button>

                  <button
                    onClick={() => setMethod('bank')}
                    className={`
                      flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                      ${method === 'bank'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="font-semibold">Bank Transfer</span>
                  </button>
                </div>
              </div>

              {/* PayPal Email */}
              {method === 'paypal' && (
                <Input
                  label="PayPal Email"
                  type="email"
                  value={paypalEmail}
                  onChange={setPaypalEmail}
                  placeholder="your@email.com"
                />
              )}

              {/* Submit */}
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleRequestPayout}
                loading={loading}
                icon={<Send className="w-5 h-5" />}
              >
                Request Payout
              </Button>

              {/* Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Payouts are processed within 3-5 business days. 
                  You will receive an email confirmation once your payout is processed.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
};

export default AffiliatePayouts;
