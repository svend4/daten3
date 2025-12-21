import React, { useState } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Process payment
    navigate('/payment/success');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Оформление бронирования
          </h1>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="p-8 mb-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                  Способ оплаты
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Номер карты"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    maxLength={19}
                    required
                  />

                  <Input
                    label="Имя владельца карты"
                    name="cardName"
                    placeholder="IVAN IVANOV"
                    value={formData.cardName}
                    onChange={handleChange}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Срок действия"
                      name="expiry"
                      placeholder="MM/YY"
                      value={formData.expiry}
                      onChange={handleChange}
                      maxLength={5}
                      required
                    />

                    <Input
                      label="CVV"
                      name="cvv"
                      placeholder="123"
                      type="password"
                      value={formData.cvv}
                      onChange={handleChange}
                      maxLength={3}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Защищённое соединение. Ваши данные в безопасности.</span>
                  </div>

                  <Button type="submit" fullWidth size="lg">
                    Оплатить
                  </Button>
                </form>
              </Card>
            </div>

            <div>
              <Card className="p-6 sticky top-24">
                <h3 className="text-lg font-bold mb-4">Детали бронирования</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Отель</span>
                    <span className="font-medium">Grand Hotel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Даты</span>
                    <span className="font-medium">25-30 дек</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Гости</span>
                    <span className="font-medium">2 взрослых</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-base font-bold">
                      <span>Итого</span>
                      <span className="text-primary-600">$599</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
