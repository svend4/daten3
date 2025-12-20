import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '@store/AuthContext';
import { useNavigate } from 'react-router-dom';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { formatDate } from '../../utils/formatters';

const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({ name });
      setEditing(false);
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="md:col-span-2" padding="lg">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>

                {!editing && (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={setName}
                    icon={<User className="w-5 h-5" />}
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      loading={loading}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing(false);
                        setName(user.name);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-5 h-5" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <span>Member since {formatDate(user.createdAt)}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Actions Card */}
            <Card padding="lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Account</h3>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  fullWidth
                  icon={<Shield className="w-5 h-5" />}
                  onClick={() => navigate('/profile/security')}
                >
                  Security
                </Button>

                <Button
                  variant="outline"
                  fullWidth
                  icon={<LogOut className="w-5 h-5" />}
                  onClick={handleLogout}
                >
                  Logout
                </Button>

                <Button
                  variant="outline"
                  fullWidth
                  icon={<Trash2 className="w-5 h-5" />}
                  className="text-error-600 border-error-300 hover:bg-error-50"
                >
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default Profile;
