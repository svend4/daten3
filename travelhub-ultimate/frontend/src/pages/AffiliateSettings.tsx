import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  CreditCard,
  Bell,
  Save,
  AlertCircle,
  CheckCircle,
  Wallet,
  Landmark,
  Mail,
  Users,
  DollarSign,
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

interface AffiliateSettings {
  paymentMethod: string;
  paymentDetails: {
    paypalEmail?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    swiftCode?: string;
    routingNumber?: string;
    cardNumber?: string;
    cardHolderName?: string;
  };
  notifications: {
    email: boolean;
    newReferral: boolean;
    payoutProcessed: boolean;
  };
}

const AffiliateSettings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('not_set');
  const [paymentDetails, setPaymentDetails] = useState<AffiliateSettings['paymentDetails']>({});
  const [notifications, setNotifications] = useState({
    email: true,
    newReferral: true,
    payoutProcessed: true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!authLoading && isAuthenticated) {
      fetchSettings();
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{
        success: boolean;
        data: AffiliateSettings;
      }>('/affiliate/settings');

      if (response.success && response.data) {
        setPaymentMethod(response.data.paymentMethod || 'not_set');
        setPaymentDetails(response.data.paymentDetails || {});
        setNotifications(response.data.notifications);
        logger.info('Settings loaded');
      }
    } catch (err: any) {
      logger.error('Failed to fetch settings', err);
      if (err.response?.status === 404) {
        setError('You need to register as an affiliate first.');
      } else {
        setError(err.response?.data?.message || 'Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await api.put<{
        success: boolean;
        message: string;
      }>('/affiliate/settings', {
        paymentMethod,
        paymentDetails,
        notifications,
      });

      if (response.success) {
        setSuccess('Settings saved successfully!');
        logger.info('Settings updated');

        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      logger.error('Failed to save settings', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentDetail = (field: string, value: string) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderPaymentMethodFields = () => {
    switch (paymentMethod) {
      case 'paypal':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PayPal Email
              </label>
              <Input
                type="email"
                value={paymentDetails.paypalEmail || ''}
                onChange={(e) => updatePaymentDetail('paypalEmail', e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
          </div>
        );

      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <Input
                type="text"
                value={paymentDetails.bankName || ''}
                onChange={(e) => updatePaymentDetail('bankName', e.target.value)}
                placeholder="Bank of America"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name
              </label>
              <Input
                type="text"
                value={paymentDetails.accountHolderName || ''}
                onChange={(e) => updatePaymentDetail('accountHolderName', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <Input
                type="text"
                value={paymentDetails.accountNumber || ''}
                onChange={(e) => updatePaymentDetail('accountNumber', e.target.value)}
                placeholder="1234567890"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing Number
                </label>
                <Input
                  type="text"
                  value={paymentDetails.routingNumber || ''}
                  onChange={(e) => updatePaymentDetail('routingNumber', e.target.value)}
                  placeholder="123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SWIFT Code (International)
                </label>
                <Input
                  type="text"
                  value={paymentDetails.swiftCode || ''}
                  onChange={(e) => updatePaymentDetail('swiftCode', e.target.value)}
                  placeholder="BOFAUS3N"
                />
              </div>
            </div>
          </div>
        );

      case 'card':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Holder Name
              </label>
              <Input
                type="text"
                value={paymentDetails.cardHolderName || ''}
                onChange={(e) => updatePaymentDetail('cardHolderName', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number (Last 4 digits)
              </label>
              <Input
                type="text"
                value={paymentDetails.cardNumber || ''}
                onChange={(e) => updatePaymentDetail('cardNumber', e.target.value)}
                placeholder="****1234"
                maxLength={4}
              />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                For security, we only store the last 4 digits. Full card details will be collected during payout processing.
              </p>
            </div>
          </div>
        );

      case 'not_set':
        return (
          <div className="p-6 bg-gray-50 rounded-lg text-center">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Please select a payment method above</p>
          </div>
        );

      default:
        return null;
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
              <p className="mt-4 text-gray-600">Loading settings...</p>
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
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Affiliate Settings</h1>
            </div>
            <p className="text-gray-600">Manage your payment details and notification preferences</p>
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

          <div className="space-y-6">
            {/* Payment Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-primary-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                  <p className="text-sm text-gray-600">Set up how you want to receive your payouts</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="grid md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        paymentMethod === 'paypal'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Wallet className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'paypal' ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <p className={`text-sm font-medium ${
                        paymentMethod === 'paypal' ? 'text-primary-900' : 'text-gray-700'
                      }`}>
                        PayPal
                      </p>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Landmark className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'bank_transfer' ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <p className={`text-sm font-medium ${
                        paymentMethod === 'bank_transfer' ? 'text-primary-900' : 'text-gray-700'
                      }`}>
                        Bank Transfer
                      </p>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        paymentMethod === 'card'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'card' ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <p className={`text-sm font-medium ${
                        paymentMethod === 'card' ? 'text-primary-900' : 'text-gray-700'
                      }`}>
                        Debit Card
                      </p>
                    </button>
                  </div>
                </div>

                {/* Payment Method Fields */}
                <div className="pt-4 border-t">
                  {renderPaymentMethodFields()}
                </div>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-primary-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-600">Choose which notifications you want to receive</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive all notifications via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, email: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {/* New Referral Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">New Referral Alerts</p>
                      <p className="text-sm text-gray-600">Get notified when someone uses your referral link</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.newReferral}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, newReferral: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {/* Payout Processed Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Payout Updates</p>
                      <p className="text-sm text-gray-600">Get notified when your payouts are processed</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.payoutProcessed}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, payoutProcessed: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate('/affiliate/dashboard')}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                icon={<Save className="w-4 h-4" />}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default AffiliateSettings;
