import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Profile: React.FC = () => {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'Иван',
    lastName: 'Иванов',
    email: 'ivan@example.com',
    phone: '+7 (999) 123-45-67',
    city: 'Москва',
    birthDate: '1990-01-01',
  });

  const handleSave = () => {
    // Save profile logic here
    setEditing(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Мой профиль
            </h1>
            <p className="text-gray-600">
              Управляйте своей личной информацией
            </p>
          </div>

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
                  <p className="text-gray-600">{profile.email}</p>
                </div>
              </div>
              <Button
                variant={editing ? 'outline' : 'primary'}
                onClick={() => (editing ? handleSave() : setEditing(true))}
              >
                {editing ? 'Сохранить' : 'Редактировать'}
              </Button>
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
              />

              <Input
                label="Фамилия"
                value={profile.lastName}
                onChange={(e) =>
                  setProfile({ ...profile, lastName: e.target.value })
                }
                disabled={!editing}
                icon={<User className="w-5 h-5" />}
              />

              <Input
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                disabled={!editing}
                icon={<Mail className="w-5 h-5" />}
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
              />

              <Input
                label="Город"
                value={profile.city}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
                disabled={!editing}
                icon={<MapPin className="w-5 h-5" />}
              />

              <Input
                label="Дата рождения"
                type="date"
                value={profile.birthDate}
                onChange={(e) =>
                  setProfile({ ...profile, birthDate: e.target.value })
                }
                disabled={!editing}
                icon={<Calendar className="w-5 h-5" />}
              />
            </div>

            {editing && (
              <div className="mt-6 flex gap-4">
                <Button onClick={handleSave}>Сохранить изменения</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Отмена
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
