import React, { useState, useEffect, useCallback, memo, useId } from 'react';
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

/**
 * Email verification page - confirms user's email address.
 */
const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [message, setMessage] = useState('');

  // Unique IDs for accessibility
  const headingId = useId();
  const statusId = useId();

  useEffect(() => {
    const verifyEmail = async () => {
      // Check if token exists
      if (!token) {
        setStatus('invalid');
        setMessage('Токен подтверждения отсутствует. Проверьте ссылку в письме.');
        return;
      }

      try {
        const response = await api.get<{
          success: boolean;
          message: string;
        }>(`/auth/verify-email?token=${encodeURIComponent(token)}`);

        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email успешно подтверждён!');
          logger.info('Email verified successfully');

          // Redirect to login or dashboard after 3 seconds
          setTimeout(() => {
            if (isAuthenticated) {
              navigate('/dashboard');
            } else {
              navigate('/login', {
                state: { message: 'Email подтверждён! Войдите для продолжения.' },
              });
            }
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.message || 'Не удалось подтвердить email');
        }
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: { message?: string } } };
        logger.error('Email verification failed', err);
        const errorMessage = apiError.response?.data?.message || 'Подтверждение не удалось. Возможно, ссылка истекла.';
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, isAuthenticated, navigate]);

  const handleNavigateToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleNavigateToProfile = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  const handleNavigateToRegister = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  const handleNavigateToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center py-8" role="status" aria-live="polite">
            <div
              className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6"
              aria-hidden="true"
            >
              <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h2 id={statusId} className="text-2xl font-bold text-gray-900 mb-3">
              Проверяем ваш email...
            </h2>
            <p className="text-gray-600">
              Пожалуйста, подождите, мы подтверждаем ваш адрес электронной почты
            </p>
            <span className="sr-only">Идёт проверка</span>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8" role="status" aria-live="polite">
            <div
              className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
              aria-hidden="true"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 id={statusId} className="text-2xl font-bold text-gray-900 mb-3">
              Email успешно подтверждён!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Card className="p-4 bg-green-50 border-green-200 mb-6">
              <p className="text-sm text-green-800">
                Переадресация на {isAuthenticated ? 'личный кабинет' : 'страницу входа'}...
              </p>
            </Card>
            <div className="flex gap-3 justify-center" role="group" aria-label="Навигация">
              <Button
                onClick={isAuthenticated ? handleNavigateToDashboard : handleNavigateToLogin}
                size="lg"
              >
                {isAuthenticated ? 'Перейти в кабинет' : 'Перейти к входу'}
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8" role="alert" aria-live="assertive">
            <div
              className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6"
              aria-hidden="true"
            >
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 id={statusId} className="text-2xl font-bold text-gray-900 mb-3">
              Подтверждение не удалось
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Card className="p-4 bg-red-50 border-red-200 mb-6">
              <div className="text-sm text-red-800 space-y-2">
                <p className="font-semibold">Возможные причины:</p>
                <ul className="list-disc list-inside text-left">
                  <li>Срок действия ссылки истёк</li>
                  <li>Ссылка уже была использована</li>
                  <li>Ссылка повреждена или недействительна</li>
                </ul>
              </div>
            </Card>
            <div className="flex gap-3 justify-center" role="group" aria-label="Действия">
              {isAuthenticated ? (
                <>
                  <Button onClick={handleNavigateToProfile} variant="outline">
                    Перейти в профиль
                  </Button>
                  <Button onClick={handleRetry}>
                    Попробовать снова
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleNavigateToRegister} variant="outline">
                    Зарегистрироваться снова
                  </Button>
                  <Button onClick={handleNavigateToLogin}>
                    Перейти к входу
                  </Button>
                </>
              )}
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center py-8" role="alert" aria-live="assertive">
            <div
              className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6"
              aria-hidden="true"
            >
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 id={statusId} className="text-2xl font-bold text-gray-900 mb-3">
              Недействительная ссылка
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Card className="p-4 bg-yellow-50 border-yellow-200 mb-6">
              <p className="text-sm text-yellow-800">
                Проверьте письмо и перейдите по ссылке для подтверждения email.
              </p>
            </Card>
            <div className="flex gap-3 justify-center" role="group" aria-label="Действия">
              <Button onClick={handleNavigateToHome} variant="outline">
                На главную
              </Button>
              <Button onClick={handleNavigateToLogin}>
                Перейти к входу
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Подтверждение email"
      >
        <Container>
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <header className="text-center mb-8">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4"
                  aria-hidden="true"
                >
                  <Mail className="w-8 h-8 text-primary-600" />
                </div>
                <h1 id={headingId} className="text-3xl font-bold text-gray-900 mb-2">
                  Подтверждение Email
                </h1>
              </header>

              {renderContent()}
            </Card>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(EmailVerification);
