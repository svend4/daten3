import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if token is present
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Validate password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>('/auth/reset-password', {
        token,
        newPassword: password,
      });

      if (response.success) {
        setSuccess(true);
        logger.info('Password reset successfully');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Password reset successfully. Please log in with your new password.' },
          });
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      logger.error('Failed to reset password', err);
      const errorMessage = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <Container>
          <div className="max-w-md mx-auto">
            <Card className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Reset Password
                </h1>
                <p className="text-gray-600">
                  Enter your new password below
                </p>
              </div>

              {/* Success Message */}
              {success ? (
                <Card className="p-6 bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">
                        Password Reset Successful
                      </h3>
                      <p className="text-sm text-green-800">
                        Your password has been reset successfully. Redirecting to login...
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Error Message */}
                  {error && (
                    <Card className="p-4 mb-6 bg-red-50 border-red-200">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">{error}</span>
                      </div>
                    </Card>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <Input
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        icon={<Lock className="w-5 h-5" />}
                        helpText="At least 8 characters with uppercase, lowercase, and numbers"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        icon={<Lock className="w-5 h-5" />}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        Password Requirements:
                      </h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-600' : 'bg-gray-400'}`} />
                          At least 8 characters
                        </li>
                        <li className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-600' : 'bg-gray-400'}`} />
                          One uppercase letter
                        </li>
                        <li className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-green-600' : 'bg-gray-400'}`} />
                          One lowercase letter
                        </li>
                        <li className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-green-600' : 'bg-gray-400'}`} />
                          One number
                        </li>
                        <li className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${password && password === confirmPassword ? 'bg-green-600' : 'bg-gray-400'}`} />
                          Passwords match
                        </li>
                      </ul>
                    </div>

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      loading={loading}
                      disabled={!token}
                    >
                      {loading ? 'Resetting Password...' : 'Reset Password'}
                    </Button>
                  </form>

                  {/* Help Text */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Remember your password?{' '}
                      <Button
                        variant="link"
                        onClick={() => navigate('/login')}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Back to Login
                      </Button>
                    </p>
                  </div>
                </>
              )}
            </Card>

            {/* Additional Help */}
            {!success && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Link expired?{' '}
                  <Button
                    variant="link"
                    onClick={() => navigate('/forgot-password')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Request a new one
                  </Button>
                </p>
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
