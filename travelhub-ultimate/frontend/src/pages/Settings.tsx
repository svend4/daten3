import React, { useState } from 'react';
import { Settings as SettingsIcon, Lock, Shield, AlertCircle, Save, CheckCircle, Trash2, X } from 'lucide-react';
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

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await api.put<{
        success: boolean;
        message: string;
      }>('/auth/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        setSuccess('Password changed successfully');
        // Clear form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        logger.info('Password changed successfully');

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (err: any) {
      logger.error('Failed to change password', err);
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Validate confirmation
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      setDeleting(true);
      setError('');

      const response = await api.delete<{
        success: boolean;
        message: string;
      }>('/auth/me');

      if (response.success) {
        logger.info('Account deleted successfully');

        // Logout user
        await logout();

        // Redirect to home page
        navigate('/', {
          state: {
            message: 'Your account has been permanently deleted. We\'re sorry to see you go!'
          }
        });
      } else {
        setError(response.message || 'Failed to delete account');
      }
    } catch (err: any) {
      logger.error('Failed to delete account', err);
      setError(err.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  // Loading state
  if (authLoading) {
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

  // Authentication guard
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12">
          <Container>
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Please Log In
              </h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to access settings.
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
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Account Settings
              </h1>
            </div>
            <p className="text-gray-600">
              Manage your account security and preferences
            </p>
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

          {/* Password Change Section */}
          <Card className="p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Change Password
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Update your password to keep your account secure
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                placeholder="Enter current password"
                required
                icon={<Lock className="w-5 h-5" />}
              />

              <Input
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="Enter new password"
                required
                helpText="At least 8 characters"
                icon={<Lock className="w-5 h-5" />}
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="Confirm new password"
                required
                icon={<Lock className="w-5 h-5" />}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  loading={loading}
                  icon={<Save className="w-5 h-5" />}
                >
                  Change Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }
                  disabled={loading}
                >
                  Clear
                </Button>
              </div>
            </form>
          </Card>

          {/* Security Settings */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Security
              </h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Additional security features will be available soon. Currently, you can change your password above.
              </p>

              {/* TODO: Implement these security features
              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enable 2FA
                </Button>
              </div>

              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <h3 className="font-semibold text-gray-900">Active Sessions</h3>
                  <p className="text-sm text-gray-600">
                    Manage your active login sessions
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Manage Sessions
                </Button>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Login History</h3>
                  <p className="text-sm text-gray-600">
                    View recent login activity on your account
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View History
                </Button>
              </div>
              */}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-8 mt-6 border-red-200 bg-red-50">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Danger Zone
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  onClick={() => setShowDeleteModal(true)}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </Container>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-red-600">Delete Account</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold mb-2">Warning: This action is permanent!</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>All your bookings will be cancelled</li>
                        <li>Your favorites and price alerts will be deleted</li>
                        <li>Your affiliate network will be disbanded</li>
                        <li>All personal data will be erased</li>
                        <li>This action cannot be reversed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">
                  Please type <strong className="text-red-600">DELETE</strong> to confirm account deletion:
                </p>

                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteAccount}
                  loading={deleting}
                  disabled={deleteConfirmation.toLowerCase() !== 'delete'}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Delete Forever
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
