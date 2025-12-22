import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, AlertCircle, Save, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
}

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

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
        setSuccess('Profile updated successfully');
        setOriginalProfile(profile);
        setEditing(false);

        // Refresh user data in AuthContext
        await refreshUser();

        logger.info('Profile updated successfully');

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      logger.error('Failed to update profile', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setEditing(false);
    setError('');
    setSuccess('');
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
              <p className="mt-4 text-gray-600">Loading your profile...</p>
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
                You need to be logged in to view your profile.
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Мой профиль
            </h1>
            <p className="text-gray-600">
              Управляйте своей личной информацией
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <Card className="p-4 mb-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <Save className="w-5 h-5" />
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

          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Role: <span className="font-medium capitalize">{user.role}</span>
                  </p>
                </div>
              </div>
              {!editing && (
                <Button onClick={() => setEditing(true)}>
                  Редактировать
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Имя"
                value={profile.firstName}
                onChange={(e) =>
                  setProfile({ ...profile, firstName: e.target.value })
                }
                disabled={!editing}
                icon={<User className="w-5 h-5" />}
                required
              />

              <Input
                label="Фамилия"
                value={profile.lastName}
                onChange={(e) =>
                  setProfile({ ...profile, lastName: e.target.value })
                }
                disabled={!editing}
                icon={<User className="w-5 h-5" />}
                required
              />

              <Input
                label="Email"
                type="email"
                value={user.email}
                disabled
                icon={<Mail className="w-5 h-5" />}
                helpText="Email cannot be changed"
              />

              <Input
                label="Телефон"
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                disabled={!editing}
                icon={<Phone className="w-5 h-5" />}
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            {editing && (
              <div className="mt-6 flex gap-4">
                <Button
                  onClick={handleSave}
                  loading={loading}
                  icon={<Save className="w-5 h-5" />}
                >
                  Сохранить изменения
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  icon={<X className="w-5 h-5" />}
                >
                  Отмена
                </Button>
              </div>
            )}
          </Card>

          {/* Additional Info Card */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Account ID:</span>
                <span className="font-mono text-gray-900">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Member since:</span>
                <span className="text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
