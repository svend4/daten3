import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Wifi, Coffee, Car, Users, Check, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const HotelDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Demo hotel data
  const hotel = {
    id: id || '1',
    name: 'Grand Plaza Hotel',
    location: 'Москва, Центр',
    rating: 4.8,
    reviews: 1234,
    stars: 5,
    price: 12500,
    images: [
      'https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Hotel+Image+1',
      'https://via.placeholder.com/800x400/7C3AED/FFFFFF?text=Hotel+Image+2',
    ],
    description: 'Роскошный отель в центре Москвы с современными удобствами и превосходным обслуживанием.',
    amenities: [
      { icon: Wifi, name: 'Бесплатный WiFi' },
      { icon: Coffee, name: 'Завтрак включен' },
      { icon: Car, name: 'Парковка' },
      { icon: Users, name: 'Спа-центр' },
    ],
    rooms: [
      { id: '1', type: 'Стандартный номер', price: 8500, capacity: 2 },
      { id: '2', type: 'Люкс', price: 15000, capacity: 3 },
      { id: '3', type: 'Президентский люкс', price: 25000, capacity: 4 },
    ],
  };

  const handleBooking = () => {
    if (selectedRoom) {
      navigate('/checkout', { state: { hotel, roomId: selectedRoom } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hotel Images */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {hotel.images.map((img, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden">
                <img src={img} alt={`${hotel.name} ${idx + 1}`} className="w-full h-64 object-cover" />
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(hotel.stars)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{hotel.location}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{hotel.rating}</span>
                  </div>
                  <span className="text-gray-600">({hotel.reviews} отзывов)</span>
                </div>
              </div>

              {/* Description */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">О отеле</h2>
                <p className="text-gray-700">{hotel.description}</p>
              </Card>

              {/* Amenities */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Удобства</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {hotel.amenities.map((amenity, idx) => {
                    const Icon = amenity.icon;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="text-gray-700">{amenity.name}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Available Rooms */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Доступные номера</h2>
                <div className="space-y-4">
                  {hotel.rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedRoom === room.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedRoom(room.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{room.type}</h3>
                          <p className="text-gray-600 text-sm">До {room.capacity} гостей</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-600">
                            {room.price.toLocaleString('ru-RU')} ₽
                          </div>
                          <div className="text-sm text-gray-600">за ночь</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-900">
                    от {hotel.price.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-gray-600">за ночь</div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата заезда
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата выезда
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Гости
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option>1 гость</option>
                      <option>2 гостя</option>
                      <option>3 гостя</option>
                      <option>4+ гостей</option>
                    </select>
                  </div>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  onClick={handleBooking}
                  disabled={!selectedRoom}
                >
                  {selectedRoom ? 'Забронировать' : 'Выберите номер'}
                </Button>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Бесплатная отмена</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Подтверждение мгновенно</span>
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

export default HotelDetails;
