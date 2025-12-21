import React, { useState } from 'react';
import { HelpCircle, Mail, MessageSquare, Phone } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Support: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Ваше сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <HelpCircle className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Служба поддержки
            </h1>
            <p className="text-xl text-gray-600">
              Мы всегда готовы помочь вам
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center">
              <Mail className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Email</h3>
              <p className="text-gray-600">support@travelhub.com</p>
              <p className="text-sm text-gray-500 mt-2">
                Ответ в течение 24 часов
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Phone className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Телефон</h3>
              <p className="text-gray-600">+7 (800) 123-45-67</p>
              <p className="text-sm text-gray-500 mt-2">
                Пн-Пт: 9:00 - 21:00
              </p>
            </Card>

            <Card className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Онлайн-чат</h3>
              <p className="text-gray-600">Круглосуточно</p>
              <Button variant="outline" size="sm" className="mt-2">
                Начать чат
              </Button>
            </Card>
          </div>

          <Card className="p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Свяжитесь с нами
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Ваше имя"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <Input
                label="Тема"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сообщение
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <Button type="submit" fullWidth>
                Отправить сообщение
              </Button>
            </form>
          </Card>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-8">
              Часто задаваемые вопросы
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold mb-2">Как отменить бронирование?</h3>
                <p className="text-gray-600">
                  Войдите в личный кабинет, откройте раздел "Мои бронирования"
                  и нажмите "Отменить" напротив нужного бронирования.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">Как изменить дату поездки?</h3>
                <p className="text-gray-600">
                  Свяжитесь с нашей службой поддержки. Возможность изменения
                  зависит от условий выбранного тарифа.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">Как получить чек?</h3>
                <p className="text-gray-600">
                  Электронный чек отправляется на ваш email сразу после оплаты.
                  Также его можно скачать в личном кабинете.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">Безопасны ли мои данные?</h3>
                <p className="text-gray-600">
                  Да, мы используем современные методы шифрования и соблюдаем все
                  стандарты безопасности для защиты ваших данных.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
