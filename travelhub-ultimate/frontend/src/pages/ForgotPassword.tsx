import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>('/auth/forgot-password', { email });

      if (response.success) {
        setSuccess(true);
        logger.info('Password reset email sent', { email });
      } else {
        setError(response.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      logger.error('Failed to send password reset email', err);
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
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
                  <Mail className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Forgot Password?
                </h1>
                <p className="text-gray-600">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>

              {/* Success Message */}
              {success ? (
                <div className="space-y-6">
                  <Card className="p-6 bg-green-50 border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900 mb-1">
                          Check your email
                        </h3>
                        <p className="text-sm text-green-800">
                          We've sent password reset instructions to <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-green-800 mt-2">
                          If you don't see the email, check your spam folder.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Error Message */}
                  {error && (
                    <Card className="p-4 mb-6 bg-red-50 border-red-200">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                      </div>
                    </Card>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      icon={<Mail className="w-5 h-5" />}
                      autoComplete="email"
                    />

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      loading={loading}
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>

                  {/* Back to Login */}
                  <div className="mt-6 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </Link>
                  </div>
                </>
              )}
            </Card>

            {/* Additional Help */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
