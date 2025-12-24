import React, { useState, useCallback, memo, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import { useAuth } from '../store/AuthContext';
import { registerSchema, type RegisterFormData, validateForm } from '../utils/validators';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const formId = useId();

  // Form state
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState('');

  // Handle input changes
  const handleChange = useCallback((field: keyof RegisterFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) {
      setServerError('');
    }
  }, [errors, serverError]);

  // Validate form on blur
  const handleBlur = useCallback((field: keyof RegisterFormData) => () => {
    const result = validateForm(registerSchema, formData);
    if (!result.success && result.errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors?.[field] }));
    }
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setTermsError('');

    // Validate terms agreement
    if (!agreedToTerms) {
      setTermsError('Необходимо принять условия использования');
      return;
    }

    // Validate all fields
    const result = validateForm(registerSchema, formData);
    if (!result.success) {
      setErrors(result.errors as FormErrors);
      return;
    }

    setLoading(true);

    try {
      // Use AuthContext register which handles httpOnly cookies
      const registerResult = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      if (registerResult.success) {
        // Navigate to dashboard
        // Tokens are automatically stored in httpOnly cookies by server
        navigate('/dashboard');
      } else {
        setServerError(registerResult.error || 'Ошибка регистрации. Попробуйте позже.');
      }
    } catch {
      setServerError('Произошла неожиданная ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [formData, agreedToTerms, register, navigate]);

  // Handle Google OAuth
  const handleGoogleAuth = useCallback(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
    window.location.href = `${baseUrl}/api/auth/google`;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-grow bg-gray-50 py-12" role="main">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-primary-600" aria-hidden="true" />
              </div>
              <h1 id={`${formId}-title`} className="text-3xl font-bold text-gray-900 mb-2">
                Создать аккаунт
              </h1>
              <p className="text-gray-600">
                Зарегистрируйтесь чтобы начать бронирование
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              noValidate
              aria-labelledby={`${formId}-title`}
            >
              {/* Server Error Alert */}
              {serverError && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="firstName"
                  label="Имя"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  onBlur={handleBlur('firstName')}
                  placeholder="Иван"
                  error={errors.firstName}
                  required
                  autoComplete="given-name"
                  icon={<User className="w-5 h-5" />}
                />
                <Input
                  name="lastName"
                  label="Фамилия"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  onBlur={handleBlur('lastName')}
                  placeholder="Иванов"
                  error={errors.lastName}
                  required
                  autoComplete="family-name"
                  icon={<User className="w-5 h-5" />}
                />
              </div>

              {/* Email Field */}
              <Input
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                placeholder="your@email.com"
                error={errors.email}
                required
                autoComplete="email"
                icon={<Mail className="w-5 h-5" />}
              />

              {/* Password Field */}
              <Input
                name="password"
                label="Пароль"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                placeholder="••••••••"
                error={errors.password}
                required
                autoComplete="new-password"
                helperText="Минимум 8 символов, заглавная и строчная буква, цифра"
                icon={<Lock className="w-5 h-5" />}
              />

              {/* Confirm Password Field */}
              <Input
                name="confirmPassword"
                label="Подтвердите пароль"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                placeholder="••••••••"
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
                icon={<Lock className="w-5 h-5" />}
              />

              {/* Terms Agreement */}
              <div className="space-y-1">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (termsError) setTermsError('');
                    }}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                    aria-describedby={`${formId}-terms-desc`}
                    aria-invalid={!!termsError}
                  />
                  <span
                    id={`${formId}-terms-desc`}
                    className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors"
                  >
                    Я согласен с{' '}
                    <Link
                      to="/terms"
                      className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus-visible:underline"
                    >
                      Условиями использования
                    </Link>{' '}
                    и{' '}
                    <Link
                      to="/privacy"
                      className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus-visible:underline"
                    >
                      Политикой конфиденциальности
                    </Link>
                  </span>
                </label>
                {termsError && (
                  <p className="text-sm text-red-600 ml-6" role="alert">
                    {termsError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                loading={loading}
                size="lg"
              >
                Зарегистрироваться
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Уже есть аккаунт?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-semibold focus:outline-none focus-visible:underline"
                >
                  Войти
                </Link>
              </p>
            </div>

            {/* Divider */}
            <div className="mt-8 relative" role="separator">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Или зарегистрироваться с
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label="Зарегистрироваться через Google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Продолжить с Google
                </span>
              </button>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default memo(Register);
