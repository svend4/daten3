import React, { useState, useCallback, memo, useId } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schema
const emailSchema = z.string().email('Введите корректный email адрес');

/**
 * Forgot password page - request password reset link.
 */
const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Unique IDs for accessibility
  const headingId = useId();
  const errorId = useId();
  const successId = useId();

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (error) setError('');
  }, [error]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate with Zod
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
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
        setError(response.message || 'Не удалось отправить письмо');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to send password reset email', err);
      setError(apiError.response?.data?.message || 'Не удалось отправить письмо. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleNavigateToRegister = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Восстановление пароля"
      >
        <Container>
          <div className="max-w-md mx-auto">
            <Card className="p-8">
              {/* Header */}
              <header className="text-center mb-8">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4"
                  aria-hidden="true"
                >
                  <Mail className="w-8 h-8 text-primary-600" />
                </div>
                <h1 id={headingId} className="text-3xl font-bold text-gray-900 mb-2">
                  Забыли пароль?
                </h1>
                <p className="text-gray-600">
                  Введите email, и мы отправим вам ссылку для сброса пароля
                </p>
              </header>

              {/* Success Message */}
              {success ? (
                <div className="space-y-6">
                  <div
                    className="p-6 bg-green-50 border border-green-200 rounded-lg"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <h2 id={successId} className="font-semibold text-green-900 mb-1">
                          Проверьте почту
                        </h2>
                        <p className="text-sm text-green-800">
                          Мы отправили инструкции по сбросу пароля на <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-green-800 mt-2">
                          Если письмо не пришло, проверьте папку «Спам».
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                    >
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                      Вернуться к входу
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Error Message */}
                  {error && (
                    <div
                      className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg"
                      role="alert"
                      aria-live="assertive"
                    >
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" aria-hidden="true" />
                        <span id={errorId}>{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    aria-labelledby={headingId}
                  >
                    <Input
                      label="Email адрес"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Введите ваш email"
                      required
                      icon={<Mail className="w-5 h-5" />}
                      autoComplete="email"
                      error={error ? ' ' : undefined}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      loading={loading}
                    >
                      {loading ? 'Отправка...' : 'Отправить ссылку'}
                    </Button>
                  </form>

                  {/* Back to Login */}
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleNavigateToLogin}
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                    >
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                      Вернуться к входу
                    </button>
                  </div>
                </>
              )}
            </Card>

            {/* Additional Help */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Нет аккаунта?{' '}
                <button
                  onClick={handleNavigateToRegister}
                  className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
                >
                  Зарегистрироваться
                </button>
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(ForgotPassword);
