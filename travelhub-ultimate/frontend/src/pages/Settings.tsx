import React, { useState, useCallback, memo, useId } from 'react';
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
import { resetPasswordSchema, validateForm } from '../utils/validators';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  currentPassword?: string;
  password?: string;
  confirmPassword?: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Unique IDs for accessibility
  const passwordFormId = useId();
  const deleteModalId = useId();
  const successId = useId();
  const errorId = useId();

  // Password change form
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handlePasswordInputChange = useCallback((field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    const errorField = field === 'newPassword' ? 'password' : field;
    if (formErrors[errorField as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [errorField]: undefined }));
    }
  }, [formErrors]);

  const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const result = validateForm(resetPasswordSchema, {
      password: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    });

    if (!result.success) {
      setFormErrors(result.errors as FormErrors);
      return;
    }

    if (!passwordForm.currentPassword) {
      setFormErrors({ currentPassword: 'Введите текущий пароль' });
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
      }>('/auth/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        setSuccess('Пароль успешно изменён');
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
        setError(response.message || 'Не удалось изменить пароль');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to change password', err);
      setError(apiError.response?.data?.message || 'Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  }, [passwordForm]);

  const handleClearForm = useCallback(() => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setFormErrors({});
  }, []);

  const handleOpenDeleteModal = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteConfirmation('');
  }, []);

  const handleDeleteConfirmationChange = useCallback((value: string) => {
    setDeleteConfirmation(value);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    // Validate confirmation
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      setError('Введите DELETE для подтверждения');
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
            message: 'Ваш аккаунт был удалён. Нам жаль, что вы уходите!'
          }
        });
      } else {
        setError(response.message || 'Не удалось удалить аккаунт');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      logger.error('Failed to delete account', err);
      setError(apiError.response?.data?.message || 'Не удалось удалить аккаунт. Попробуйте снова.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  }, [deleteConfirmation, logout, navigate]);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-grow bg-gray-50 py-12"
          role="main"
          aria-label="Настройки аккаунта"
          aria-busy="true"
        >
          <Container>
            <div className="text-center py-12" role="status" aria-live="polite">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"
                aria-hidden="true"
              />
              <p className="mt-4 text-gray-600">Загрузка настроек...</p>
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
                Для доступа к настройкам необходимо войти в аккаунт.
              </p>
              <Button onClick={handleNavigateToLogin}>
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
        aria-label="Настройки аккаунта"
      >
        <Container>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-primary-600" aria-hidden="true" />
              <h1 className="text-3xl font-bold text-gray-900">
                Настройки аккаунта
              </h1>
            </div>
            <p className="text-gray-600">
              Управление безопасностью и параметрами аккаунта
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

          {/* Password Change Section */}
          <Card className="p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-primary-600" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-900">
                Изменение пароля
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Обновите пароль для защиты аккаунта
            </p>

            <form
              id={passwordFormId}
              onSubmit={handlePasswordChange}
              className="space-y-4"
              aria-label="Форма изменения пароля"
            >
              <Input
                label="Текущий пароль"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(value) => handlePasswordInputChange('currentPassword', value)}
                placeholder="Введите текущий пароль"
                required
                icon={<Lock className="w-5 h-5" />}
                error={formErrors.currentPassword}
              />

              <Input
                label="Новый пароль"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(value) => handlePasswordInputChange('newPassword', value)}
                placeholder="Введите новый пароль"
                required
                helperText="Минимум 8 символов, буквы и цифры"
                icon={<Lock className="w-5 h-5" />}
                error={formErrors.password}
              />

              <Input
                label="Подтверждение пароля"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(value) => handlePasswordInputChange('confirmPassword', value)}
                placeholder="Подтвердите новый пароль"
                required
                icon={<Lock className="w-5 h-5" />}
                error={formErrors.confirmPassword}
              />

              <div className="flex gap-4 pt-4" role="group" aria-label="Действия с формой">
                <Button
                  type="submit"
                  loading={loading}
                  icon={<Save className="w-5 h-5" />}
                >
                  Изменить пароль
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearForm}
                  disabled={loading}
                >
                  Очистить
                </Button>
              </div>
            </form>
          </Card>

          {/* Security Settings */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-primary-600" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-900">
                Безопасность
              </h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Дополнительные функции безопасности будут доступны в ближайшее время.
              </p>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-8 mt-6 border-red-200 bg-red-50">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Опасная зона
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Удалить аккаунт</h3>
                  <p className="text-sm text-gray-600">
                    Безвозвратно удалить аккаунт и все связанные данные. Это действие нельзя отменить.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  onClick={handleOpenDeleteModal}
                  icon={<Trash2 className="w-4 h-4" />}
                  aria-haspopup="dialog"
                >
                  Удалить аккаунт
                </Button>
              </div>
            </div>
          </Card>
        </Container>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteModalId}
          >
            <Card className="max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 id={deleteModalId} className="text-xl font-bold text-red-600">
                  Удаление аккаунта
                </h3>
                <button
                  onClick={handleCloseDeleteModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                  aria-label="Закрыть диалог"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" role="alert">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold mb-2">Внимание: это действие необратимо!</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Все бронирования будут отменены</li>
                        <li>Избранное и уведомления о ценах будут удалены</li>
                        <li>Партнёрская сеть будет расформирована</li>
                        <li>Все личные данные будут стёрты</li>
                        <li>Это действие нельзя отменить</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">
                  Введите <strong className="text-red-600">DELETE</strong> для подтверждения:
                </p>

                <Input
                  value={deleteConfirmation}
                  onChange={handleDeleteConfirmationChange}
                  placeholder="Введите DELETE для подтверждения"
                  autoFocus
                  aria-describedby={deleteModalId}
                />
              </div>

              <div className="flex gap-3" role="group" aria-label="Действия диалога">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={handleCloseDeleteModal}
                  disabled={deleting}
                >
                  Отмена
                </Button>
                <Button
                  fullWidth
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteAccount}
                  loading={deleting}
                  disabled={deleteConfirmation.toLowerCase() !== 'delete'}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Удалить навсегда
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

export default memo(Settings);
