import React, { useState, useEffect, useCallback, useMemo, memo, useId } from 'react';
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
import { z } from 'zod';

// Validation schema for password reset
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

/**
 * Reset password page - set new password using token.
 */
const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{password?: string; confirmPassword?: string}>({});
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Unique IDs for accessibility
  const headingId = useId();
  const errorId = useId();
  const successId = useId();
  const requirementsId = useId();

  useEffect(() => {
    // Check if token is present
    if (!token) {
      setError('Недействительная или отсутствующая ссылка. Запросите новую ссылку для сброса пароля.');
    }
  }, [token]);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: undefined }));
    }
    if (error) setError('');
  }, [fieldErrors.password, error]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
    if (fieldErrors.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
    if (error) setError('');
  }, [fieldErrors.confirmPassword, error]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    setSuccess(false);

    // Validate with Zod
    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const errors: {password?: string; confirmPassword?: string} = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as 'password' | 'confirmPassword';
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Недействительный токен');
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
            state: { message: 'Пароль успешно изменён. Войдите с новым паролем.' },
          });
        }, 3000);
      } else {
        setError(response.message || 'Не удалось сбросить пароль');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to reset password', err);
      setError(apiError.response?.data?.message || 'Не удалось сбросить пароль. Возможно, ссылка истекла.');
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, token, navigate]);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleNavigateToForgotPassword = useCallback(() => {
    navigate('/forgot-password');
  }, [navigate]);

  // Password requirements status
  const requirements = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  }), [password, confirmPassword]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Сброс пароля"
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
                  <Lock className="w-8 h-8 text-primary-600" />
                </div>
                <h1 id={headingId} className="text-3xl font-bold text-gray-900 mb-2">
                  Сброс пароля
                </h1>
                <p className="text-gray-600">
                  Введите новый пароль ниже
                </p>
              </header>

              {/* Success Message */}
              {success ? (
                <div
                  className="p-6 bg-green-50 border border-green-200 rounded-lg"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h2 id={successId} className="font-semibold text-green-900 mb-1">
                        Пароль успешно изменён
                      </h2>
                      <p className="text-sm text-green-800">
                        Переадресация на страницу входа...
                      </p>
                    </div>
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
                        <span id={errorId} className="text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    aria-labelledby={headingId}
                  >
                    <div className="relative">
                      <Input
                        label="Новый пароль"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Введите новый пароль"
                        required
                        icon={<Lock className="w-5 h-5" />}
                        error={fieldErrors.password}
                        aria-describedby={requirementsId}
                      />
                      <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" aria-hidden="true" />
                        ) : (
                          <Eye className="w-5 h-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        label="Подтвердите пароль"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder="Подтвердите новый пароль"
                        required
                        icon={<Lock className="w-5 h-5" />}
                        error={fieldErrors.confirmPassword}
                      />
                      <button
                        type="button"
                        onClick={toggleShowConfirmPassword}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                        aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" aria-hidden="true" />
                        ) : (
                          <Eye className="w-5 h-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {/* Password Requirements */}
                    <div
                      id={requirementsId}
                      className="bg-blue-50 p-4 rounded-lg"
                      role="group"
                      aria-label="Требования к паролю"
                    >
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">
                        Требования к паролю:
                      </h3>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${requirements.length ? 'bg-green-600' : 'bg-gray-400'}`}
                            aria-hidden="true"
                          />
                          <span className={requirements.length ? 'text-green-700' : ''}>
                            Минимум 8 символов
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${requirements.uppercase ? 'bg-green-600' : 'bg-gray-400'}`}
                            aria-hidden="true"
                          />
                          <span className={requirements.uppercase ? 'text-green-700' : ''}>
                            Одна заглавная буква
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${requirements.lowercase ? 'bg-green-600' : 'bg-gray-400'}`}
                            aria-hidden="true"
                          />
                          <span className={requirements.lowercase ? 'text-green-700' : ''}>
                            Одна строчная буква
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${requirements.number ? 'bg-green-600' : 'bg-gray-400'}`}
                            aria-hidden="true"
                          />
                          <span className={requirements.number ? 'text-green-700' : ''}>
                            Одна цифра
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${requirements.match ? 'bg-green-600' : 'bg-gray-400'}`}
                            aria-hidden="true"
                          />
                          <span className={requirements.match ? 'text-green-700' : ''}>
                            Пароли совпадают
                          </span>
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
                      {loading ? 'Сохранение...' : 'Сбросить пароль'}
                    </Button>
                  </form>

                  {/* Help Text */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Помните пароль?{' '}
                      <button
                        onClick={handleNavigateToLogin}
                        className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
                      >
                        Вернуться к входу
                      </button>
                    </p>
                  </div>
                </>
              )}
            </Card>

            {/* Additional Help */}
            {!success && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Ссылка истекла?{' '}
                  <button
                    onClick={handleNavigateToForgotPassword}
                    className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
                  >
                    Запросить новую
                  </button>
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

export default memo(ResetPassword);
