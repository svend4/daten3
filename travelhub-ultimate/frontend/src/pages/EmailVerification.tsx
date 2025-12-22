import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { useAuth } from '../store/AuthContext';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'invalid';

const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Check if token exists
      if (!token) {
        setStatus('invalid');
        setMessage('Verification token is missing. Please check your email link.');
        return;
      }

      try {
        const response = await api.get<{
          success: boolean;
          message: string;
        }>(`/auth/verify-email?token=${encodeURIComponent(token)}`);

        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully!');
          logger.info('Email verified successfully');

          // Redirect to login or dashboard after 3 seconds
          setTimeout(() => {
            if (isAuthenticated) {
              navigate('/dashboard');
            } else {
              navigate('/login', {
                state: { message: 'Email verified! Please log in to continue.' },
              });
            }
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.message || 'Failed to verify email');
        }
      } catch (err: any) {
        logger.error('Email verification failed', err);
        const errorMessage = err.response?.data?.message || 'Verification failed. The link may have expired.';
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, isAuthenticated, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Verifying your email...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Card className="p-4 bg-green-50 border-green-200 mb-6">
              <p className="text-sm text-green-800">
                Redirecting you to {isAuthenticated ? 'dashboard' : 'login'}...
              </p>
            </Card>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                size="lg"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Card className="p-4 bg-red-50 border-red-200 mb-6">
              <div className="text-sm text-red-800 space-y-2">
                <p className="font-semibold">Common reasons:</p>
                <ul className="list-disc list-inside text-left">
                  <li>The verification link has expired</li>
                  <li>The link has already been used</li>
                  <li>The link is invalid or corrupted</li>
                </ul>
              </div>
            </Card>
            <div className="flex gap-3 justify-center">
              {isAuthenticated ? (
                <>
                  <Button onClick={() => navigate('/profile')} variant="outline">
                    Go to Profile
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigate('/register')} variant="outline">
                    Sign Up Again
                  </Button>
                  <Button onClick={() => navigate('/login')}>
                    Go to Login
                  </Button>
                </>
              )}
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Invalid Verification Link
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Card className="p-4 bg-yellow-50 border-yellow-200 mb-6">
              <p className="text-sm text-yellow-800">
                Please check your email and click on the verification link sent to you.
              </p>
            </Card>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/')} variant="outline">
                Go Home
              </Button>
              <Button onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <Container>
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Email Verification
                </h1>
              </div>

              {renderContent()}
            </Card>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default EmailVerification;
