import { useState, useMemo, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SearchWidgetExtended from '../components/features/SearchWidgetExtended';

// Memoized destination card component
const DestinationCard = memo(function DestinationCard({
  destination,
}: {
  destination: {
    city: string;
    country: string;
    price: string;
    image: string;
    description: string;
  };
}) {
  return (
    <Link
      to={`/hotels?destination=${destination.city}`}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
      aria-label={`${destination.city}, ${destination.country} - от ${destination.price}`}
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={destination.image}
          alt={`${destination.city}, ${destination.country}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow-lg">
          <span className="text-blue-600 font-bold text-lg">{destination.price}</span>
        </div>

        {/* City Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-2xl font-bold mb-1">{destination.city}</h3>
          <p className="text-sm text-gray-200 mb-2">{destination.country}</p>
          <p className="text-sm text-gray-300">{destination.description}</p>
        </div>
      </div>
    </Link>
  );
});

// Memoized feature card component
const FeatureCard = memo(function FeatureCard({
  feature,
}: {
  feature: {
    icon: string;
    title: string;
    description: string;
  };
}) {
  return (
    <article className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="text-5xl mb-4" aria-hidden="true">
        {feature.icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
    </article>
  );
});

// Memoized testimonial card component
const TestimonialCard = memo(function TestimonialCard({
  testimonial,
}: {
  testimonial: {
    name: string;
    avatar: string;
    rating: number;
    text: string;
    location: string;
  };
}) {
  return (
    <article className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl shadow-lg">
      {/* Stars */}
      <div className="flex gap-1 mb-4" aria-label={`Рейтинг: ${testimonial.rating} из 5`}>
        {[...Array(testimonial.rating)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-xl" aria-hidden="true">
            *
          </span>
        ))}
      </div>

      <blockquote className="text-gray-700 mb-6 leading-relaxed italic">
        "{testimonial.text}"
      </blockquote>

      <footer className="flex items-center gap-4">
        <img
          src={testimonial.avatar}
          alt=""
          className="w-14 h-14 rounded-full border-4 border-white shadow-lg"
          loading="lazy"
          decoding="async"
        />
        <div>
          <cite className="font-bold text-gray-900 not-italic">{testimonial.name}</cite>
          <div className="text-sm text-gray-600">{testimonial.location}</div>
        </div>
      </footer>
    </article>
  );
});

// Search params type
interface SearchParams {
  type: 'flights' | 'hotels' | 'cars';
  [key: string]: unknown;
}

function Home() {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'cars'>('hotels');
  const navigate = useNavigate();

  // Memoized data
  const popularDestinations = useMemo(
    () => [
      {
        city: 'Париж',
        country: 'Франция',
        price: '$299',
        image:
          'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
        description: 'Город огней и романтики',
      },
      {
        city: 'Токио',
        country: 'Япония',
        price: '$499',
        image:
          'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
        description: 'Современные технологии и традиции',
      },
      {
        city: 'Нью-Йорк',
        country: 'США',
        price: '$399',
        image:
          'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
        description: 'Город который никогда не спит',
      },
      {
        city: 'Бали',
        country: 'Индонезия',
        price: '$249',
        image:
          'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
        description: 'Тропический рай на земле',
      },
      {
        city: 'Дубай',
        country: 'ОАЭ',
        price: '$449',
        image:
          'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
        description: 'Роскошь и современность',
      },
      {
        city: 'Рим',
        country: 'Италия',
        price: '$279',
        image:
          'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop',
        description: 'Вечный город с богатой историей',
      },
      {
        city: 'Барселона',
        country: 'Испания',
        price: '$259',
        image:
          'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop',
        description: 'Архитектура Гауди и пляжи',
      },
      {
        city: 'Стамбул',
        country: 'Турция',
        price: '$199',
        image:
          'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=600&fit=crop',
        description: 'Мост между Востоком и Западом',
      },
    ],
    []
  );

  const features = useMemo(
    () => [
      {
        icon: '🔍',
        title: 'Лучшие цены',
        description: 'Сравниваем предложения от 500+ провайдеров для поиска лучших цен',
      },
      {
        icon: '⚡',
        title: 'Быстрый поиск',
        description: 'Результаты поиска за считанные секунды с умной фильтрацией',
      },
      {
        icon: '🔒',
        title: 'Безопасность',
        description: 'Защищенные платежи и конфиденциальность ваших данных',
      },
      {
        icon: '🎯',
        title: 'Персонализация',
        description: 'Рекомендации на основе ваших предпочтений',
      },
      {
        icon: '💰',
        title: 'Кэшбэк',
        description: 'Получайте до 5% кэшбэка за каждое бронирование',
      },
      {
        icon: '📱',
        title: 'Мобильное приложение',
        description: 'Управляйте бронированиями в любое время',
      },
    ],
    []
  );

  const testimonials = useMemo(
    () => [
      {
        name: 'Анна Смирнова',
        avatar: 'https://i.pravatar.cc/150?img=1',
        rating: 5,
        text: 'TravelHub помог мне найти отличный отель в Париже по супер цене! Сервис быстрый и удобный.',
        location: 'Москва',
      },
      {
        name: 'Дмитрий Петров',
        avatar: 'https://i.pravatar.cc/150?img=12',
        rating: 5,
        text: 'Уже третий раз бронирую через TravelHub. Всегда лучшие цены и отличная поддержка!',
        location: 'Санкт-Петербург',
      },
      {
        name: 'Елена Иванова',
        avatar: 'https://i.pravatar.cc/150?img=5',
        rating: 5,
        text: 'Партнерская программа просто отличная! Уже заработала больше $500 за месяц.',
        location: 'Екатеринбург',
      },
    ],
    []
  );

  const stats = useMemo(
    () => [
      { value: '1M+', label: 'Довольных клиентов' },
      { value: '500+', label: 'Провайдеров' },
      { value: '10K+', label: 'Направлений' },
      { value: '24/7', label: 'Поддержка' },
    ],
    []
  );

  // Memoized handlers
  const handleSearch = useCallback(
    (params: SearchParams) => {
      if (params.type === 'flights') {
        navigate('/flights', { state: { searchParams: params } });
      } else if (params.type === 'hotels') {
        navigate('/hotels', { state: { searchParams: params } });
      }
    },
    [navigate]
  );

  const handleTabChange = useCallback((tab: 'flights' | 'hotels' | 'cars') => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main id="main-content" className="flex-grow" role="main">
        {/* Hero Section with Enhanced Design */}
        <section
          className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 overflow-hidden"
          aria-labelledby="hero-title"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black opacity-10" aria-hidden="true">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative container mx-auto px-4 py-24">
            <div className="max-w-4xl mx-auto text-center text-white">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20">
                <span className="text-yellow-300" aria-hidden="true">⭐</span>
                <span className="text-sm font-medium">Более 1 млн довольных клиентов</span>
              </div>

              <h1
                id="hero-title"
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              >
                Найдите идеальное
                <span className="block bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                  путешествие мечты
                </span>
              </h1>

              <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-2xl mx-auto">
                Сравните тысячи предложений, сэкономьте до 50% и получайте кэшбэк за каждое
                бронирование
              </p>

              {/* Search Widget with Tabs */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto">
                {/* Tabs */}
                <div
                  className="flex gap-2 mb-6 border-b border-gray-200 pb-4"
                  role="tablist"
                  aria-label="Тип поиска"
                >
                  <button
                    role="tab"
                    aria-selected={activeTab === 'hotels'}
                    aria-controls="search-panel"
                    onClick={() => handleTabChange('hotels')}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      activeTab === 'hotels'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span aria-hidden="true">🏨 </span>Отели
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'flights'}
                    aria-controls="search-panel"
                    onClick={() => handleTabChange('flights')}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      activeTab === 'flights'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span aria-hidden="true">✈️ </span>Авиабилеты
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'cars'}
                    aria-controls="search-panel"
                    onClick={() => handleTabChange('cars')}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      activeTab === 'cars'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span aria-hidden="true">🚗 </span>Аренда авто
                  </button>
                </div>

                <div id="search-panel" role="tabpanel">
                  <SearchWidgetExtended onSearch={handleSearch} type={activeTab} />
                </div>
              </div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
            <svg
              viewBox="0 0 1440 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
                fill="#F9FAFB"
              />
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50" aria-label="Статистика">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-20 bg-white" aria-labelledby="destinations-title">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 id="destinations-title" className="text-4xl font-bold mb-4 text-gray-900">
                Популярные направления
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Откройте для себя самые востребованные туристические направления мира
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {popularDestinations.map((destination, index) => (
                <DestinationCard key={index} destination={destination} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/hotels"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
              >
                Посмотреть все направления
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="py-20 bg-gradient-to-br from-gray-50 to-blue-50"
          aria-labelledby="features-title"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 id="features-title" className="text-4xl font-bold mb-4 text-gray-900">
                Почему выбирают TravelHub
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Мы делаем планирование путешествий простым и выгодным
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white" aria-labelledby="testimonials-title">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 id="testimonials-title" className="text-4xl font-bold mb-4 text-gray-900">
                Отзывы наших клиентов
              </h2>
              <p className="text-xl text-gray-600">
                Более 50,000 довольных путешественников уже с нами
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          aria-labelledby="cta-title"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 id="cta-title" className="text-4xl md:text-5xl font-bold mb-6">
              Готовы начать путешествие?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
              Присоединяйтесь к миллионам путешественников и получайте лучшие предложения
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-white"
              >
                Зарегистрироваться бесплатно
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/affiliate"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-white"
              >
                Стать партнером
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default memo(Home);
