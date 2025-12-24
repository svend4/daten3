import React, { useState, useEffect, useCallback, memo, useId } from 'react';
import { User, Mail, Phone, AlertCircle, Save, X, CheckCircle, XCircle, Send } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { profileSchema, validateForm, type ProfileFormData } from '../utils/validators';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Unique IDs for accessibility
  const formId = useId();
  const successId = useId();
  const errorId = useId();
  const verificationId = useId();

  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [originalProfile, setOriginalProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Initialize profile from user context
  useEffect(() => {
    if (user) {
      const profileData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      };
      setProfile(profileData);
      setOriginalProfile(profileData);
    }
  }, [user]);

  const handleInputChange = useCallback((field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  const handleSave = useCallback(async () => {
    if (!user) return;

    // Validate with Zod
    const formData: ProfileFormData = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: user.email,
      phone: profile.phone || undefined,
    };

    const result = validateForm(profileSchema, formData);
    if (!result.success) {
      setFormErrors(result.errors as FormErrors);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setFormErrors({});

    try {
      const response = await api.put<{
        success: boolean;
        message: string;
        data: {
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone?: string;
            role: string;
          };
        };
      }>('/auth/me', profile);

      if (response.success) {
        setSuccess('Профиль успешно обновлён');
        setOriginalProfile(profile);
        setEditing(false);

        // Refresh user data in AuthContext
        await refreshUser();

        logger.info('Profile updated successfully');

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Не удалось обновить профиль');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to update profile', err);
      setError(apiError.response?.data?.message || 'Не удалось обновить профиль');
    } finally {
      setLoading(false);
    }
  }, [profile, user, refreshUser]);

  const handleCancel = useCallback(() => {
    setProfile(originalProfile);
    setEditing(false);
    setError('');
    setSuccess('');
    setFormErrors({});
  }, [originalProfile]);

  const handleStartEditing = useCallback(() => {
    setEditing(true);
  }, []);

  const handleSendVerification = useCallback(async () => {
    setSendingVerification(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>('/auth/send-verification-email', {});

      if (response.success) {
        setVerificationSent(true);
        setSuccess('Письмо для подтверждения отправлено! Проверьте почту.');
        logger.info('Verification email sent');

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.message || 'Не удалось отправить письмо');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to send verification email', err);
      setError(apiError.response?.data?.message || 'Не удалось отправить письмо');
    } finally {
      setSendingVerification(false);
    }
  }, []);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Профиль пользователя"
          aria-busy="true"
        >
          <Container>
            <div className="text-center py-12" role="status" aria-live="polite">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"
                aria-hidden="true"
              />
              <p className="mt-4 text-gray-600">Загрузка профиля...</p>
              <span className="sr-only">Пожалуйста, подождите</span>
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
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Требуется авторизация"
        >
          <Container>
            <Card className="p-12 text-center" role="alert">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Требуется вход
              </h1>
              <p className="text-gray-600 mb-6">
                Для просмотра профиля необходимо войти в аккаунт.
              </p>
              <Button onClick={() => window.location.href = '/login'}>
                Перейти к входу
              </Button>
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
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Профиль пользователя"
      >
        <Container>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Мой профиль
            </h1>
            <p className="text-gray-600">
              Управляйте своей личной информацией
            </p>
          </header>

          {/* Success Message */}
          {success && (
            <Card
              className="p-4 mb-6 bg-green-50 border-green-200"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" aria-hidden="true" />
                <span id={successId}>{success}</span>
              </div>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card
              className="p-4 mb-6 bg-red-50 border-red-200"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
                <span id={errorId}>{error}</span>
              </div>
            </Card>
          )}

          <Card className="p-8">
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Роль: <span className="font-medium capitalize">{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                  </p>
                </div>
              </div>
              {!editing && (
                <Button onClick={handleStartEditing} aria-label="Редактировать профиль">
                  Редактировать
                </Button>
              )}
            </div>

            {/* Profile Form */}
            <form
              id={formId}
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              aria-label="Форма редактирования профиля"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Имя"
                  name="firstName"
                  value={profile.firstName}
                  onChange={(value) => handleInputChange('firstName', value)}
                  disabled={!editing}
                  icon={<User className="w-5 h-5" />}
                  required
                  error={formErrors.firstName}
                  aria-describedby={formErrors.firstName ? `${formId}-firstName-error` : undefined}
                />

                <Input
                  label="Фамилия"
                  name="lastName"
                  value={profile.lastName}
                  onChange={(value) => handleInputChange('lastName', value)}
                  disabled={!editing}
                  icon={<User className="w-5 h-5" />}
                  required
                  error={formErrors.lastName}
                  aria-describedby={formErrors.lastName ? `${formId}-lastName-error` : undefined}
                />

                <div>
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={user.email}
                    disabled
                    icon={<Mail className="w-5 h-5" />}
                    helperText="Email нельзя изменить"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    {user.emailVerified ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm" role="status">
                        <CheckCircle className="w-4 h-4" aria-hidden="true" />
                        <span className="font-medium">Подтверждён</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-600 text-sm" role="status">
                        <XCircle className="w-4 h-4" aria-hidden="true" />
                        <span className="font-medium">Не подтверждён</span>
                      </div>
                    )}
                  </div>
                </div>

                <Input
                  label="Телефон"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  disabled={!editing}
                  icon={<Phone className="w-5 h-5" />}
                  placeholder="+7 (999) 123-45-67"
                  error={formErrors.phone}
                  aria-describedby={formErrors.phone ? `${formId}-phone-error` : undefined}
                />
              </div>

              {editing && (
                <div className="mt-6 flex gap-4" role="group" aria-label="Действия с формой">
                  <Button
                    type="submit"
                    loading={loading}
                    icon={<Save className="w-5 h-5" />}
                  >
                    Сохранить изменения
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    icon={<X className="w-5 h-5" />}
                  >
                    Отмена
                  </Button>
                </div>
              )}
            </form>
          </Card>

          {/* Email Verification Card */}
          {!user.emailVerified && (
            <Card
              className="p-6 mt-6 border-yellow-200 bg-yellow-50"
              aria-labelledby={verificationId}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0" aria-hidden="true">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 id={verificationId} className="text-lg font-semibold text-gray-900 mb-2">
                    Подтвердите email
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Подтвердите адрес электронной почты для доступа ко всем функциям
                    и получения уведомлений о бронированиях.
                  </p>
                  {verificationSent ? (
                    <div className="flex items-center gap-2 text-green-700 text-sm" role="status" aria-live="polite">
                      <CheckCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Письмо отправлено! Проверьте почту.</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleSendVerification}
                      loading={sendingVerification}
                      size="sm"
                      icon={<Send className="w-4 h-4" />}
                      aria-describedby={verificationId}
                    >
                      {sendingVerification ? 'Отправка...' : 'Отправить письмо'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Additional Info Card */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Информация об аккаунте
            </h3>
            <dl className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <dt>ID аккаунта:</dt>
                <dd className="font-mono text-gray-900">{user.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Дата регистрации:</dt>
                <dd className="text-gray-900">
                  {new Date().toLocaleDateString('ru-RU')}
                </dd>
              </div>
            </dl>
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(Profile);
