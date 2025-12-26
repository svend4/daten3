import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plane, Hotel, Car, Star, ChevronRight, Sparkles, Globe, Shield, Zap, Gift, Smartphone, ArrowRight } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SearchWidgetExtended from '../components/features/SearchWidgetExtended';
import SEOHead from '../components/SEO/SEOHead';

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
}

// Bento Card Component
const BentoCard = memo(function BentoCard({
  destination,
  size = 'default',
  index,
}: {
  destination: {
    city: string;
    country: string;
    price: string;
    image: string;
    description: string;
    tag?: string;
  };
  size?: 'large' | 'wide' | 'tall' | 'default';
  index: number;
}) {
  const sizeClasses = {
    large: 'col-span-2 row-span-2',
    wide: 'col-span-2',
    tall: 'row-span-2',
    default: '',
  };

  return (
    <Link
      to={`/hotels?destination=${destination.city}`}
      className={`group relative overflow-hidden rounded-3xl ${sizeClasses[size]}
                  transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500`}
      style={{ animationDelay: `${index * 100}ms` }}
      aria-label={`${destination.city}, ${destination.country} - от ${destination.price}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={destination.image}
          alt={`${destination.city}, ${destination.country}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Price Tag */}
      <div className="absolute top-4 right-4 glass rounded-full px-4 py-2 backdrop-blur-xl bg-white/20 border border-white/30">
        <span className="text-white font-bold text-lg text-shadow">{destination.price}</span>
      </div>

      {/* Featured Tag */}
      {destination.tag && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full px-3 py-1">
          <span className="text-white text-sm font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {destination.tag}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className={`font-bold mb-1 text-shadow ${size === 'large' ? 'text-3xl' : 'text-xl'}`}>
          {destination.city}
        </h3>
        <p className="text-sm text-white/80 mb-2">{destination.country}</p>
        {(size === 'large' || size === 'wide') && (
          <p className="text-sm text-white/70 line-clamp-2">{destination.description}</p>
        )}

        {/* Hover Arrow */}
        <div className="flex items-center gap-2 mt-3 opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <span className="text-sm font-medium">Подробнее</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
});

// Feature Card with icon
const FeatureCard = memo(function FeatureCard({
  feature,
  index,
}: {
  feature: {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
  };
  index: number;
}) {
  return (
    <article
      className="group glass rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`w-14 h-14 rounded-2xl ${feature.gradient} flex items-center justify-center mb-6
                       group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        {feature.icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-theme-primary">{feature.title}</h3>
      <p className="text-theme-secondary leading-relaxed">{feature.description}</p>
    </article>
  );
});

// Testimonial Card
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
    <article className="glass rounded-3xl p-8 transition-all duration-300 hover:shadow-xl">
      {/* Stars */}
      <div className="flex gap-1 mb-4" aria-label={`Рейтинг: ${testimonial.rating} из 5`}>
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" aria-hidden="true" />
        ))}
      </div>

      <blockquote className="text-theme-secondary mb-6 leading-relaxed text-lg">
        "{testimonial.text}"
      </blockquote>

      <footer className="flex items-center gap-4">
        <img
          src={testimonial.avatar}
          alt=""
          className="w-14 h-14 rounded-full border-4 border-white dark:border-dark-700 shadow-lg object-cover"
          loading="lazy"
          decoding="async"
        />
        <div>
          <cite className="font-bold text-theme-primary not-italic block">{testimonial.name}</cite>
          <div className="text-sm text-theme-muted">{testimonial.location}</div>
        </div>
      </footer>
    </article>
  );
});

// Stat Card with animation
const StatCard = memo(function StatCard({
  stat,
  index,
}: {
  stat: { value: number; suffix: string; label: string };
  index: number;
}) {
  const { count, ref } = useCounter(stat.value, 2000);

  return (
    <div
      ref={ref}
      className="text-center animate-fade-in-up"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="text-4xl md:text-5xl font-extrabold gradient-text mb-2">
        {count}{stat.suffix}
      </div>
      <div className="text-theme-secondary text-sm md:text-base">{stat.label}</div>
    </div>
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
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
        description: 'Город огней и романтики. Эйфелева башня, Лувр и лучшие круассаны.',
        tag: 'Популярное',
      },
      {
        city: 'Токио',
        country: 'Япония',
        price: '$499',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
        description: 'Современные технологии встречаются с древними традициями.',
      },
      {
        city: 'Нью-Йорк',
        country: 'США',
        price: '$399',
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
        description: 'Город который никогда не спит.',
      },
      {
        city: 'Бали',
        country: 'Индонезия',
        price: '$249',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
        description: 'Тропический рай с рисовыми террасами и храмами.',
        tag: 'Выгодно',
      },
      {
        city: 'Дубай',
        country: 'ОАЭ',
        price: '$449',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
        description: 'Роскошь и современность в пустыне.',
      },
      {
        city: 'Рим',
        country: 'Италия',
        price: '$279',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop',
        description: 'Вечный город с богатой историей.',
      },
    ],
    []
  );

  const features = useMemo(
    () => [
      {
        icon: <Search className="w-6 h-6 text-white" />,
        title: 'Умный поиск',
        description: 'Сравниваем 500+ провайдеров для поиска лучших цен за секунды',
        gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      },
      {
        icon: <Zap className="w-6 h-6 text-white" />,
        title: 'Мгновенное бронирование',
        description: 'Бронируйте в один клик с гарантией лучшей цены',
        gradient: 'bg-gradient-to-br from-orange-500 to-pink-500',
      },
      {
        icon: <Shield className="w-6 h-6 text-white" />,
        title: 'Безопасные платежи',
        description: 'SSL шифрование и защита данных банковского уровня',
        gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
      },
      {
        icon: <Globe className="w-6 h-6 text-white" />,
        title: '10,000+ направлений',
        description: 'Путешествуйте по всему миру с лучшими предложениями',
        gradient: 'bg-gradient-to-br from-purple-500 to-indigo-500',
      },
      {
        icon: <Gift className="w-6 h-6 text-white" />,
        title: 'Кэшбэк до 5%',
        description: 'Получайте возврат за каждое бронирование',
        gradient: 'bg-gradient-to-br from-pink-500 to-rose-500',
      },
      {
        icon: <Smartphone className="w-6 h-6 text-white" />,
        title: 'Мобильное приложение',
        description: 'Управляйте поездками в любое время и в любом месте',
        gradient: 'bg-gradient-to-br from-violet-500 to-purple-500',
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
        text: 'TravelHub помог найти отель в Париже по невероятной цене! Интерфейс удобный, бронирование заняло 2 минуты.',
        location: 'Москва',
      },
      {
        name: 'Дмитрий Петров',
        avatar: 'https://i.pravatar.cc/150?img=12',
        rating: 5,
        text: 'Уже третий раз бронирую через TravelHub. Всегда лучшие цены и отличная поддержка 24/7!',
        location: 'Санкт-Петербург',
      },
      {
        name: 'Елена Иванова',
        avatar: 'https://i.pravatar.cc/150?img=5',
        rating: 5,
        text: 'Партнерская программа — огонь! Заработала $500 за первый месяц, рекомендуя друзьям.',
        location: 'Екатеринбург',
      },
    ],
    []
  );

  const stats = useMemo(
    () => [
      { value: 1, suffix: 'M+', label: 'Довольных клиентов' },
      { value: 500, suffix: '+', label: 'Провайдеров' },
      { value: 10, suffix: 'K+', label: 'Направлений' },
      { value: 24, suffix: '/7', label: 'Поддержка' },
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

  const tabConfig = [
    { id: 'hotels' as const, icon: Hotel, label: 'Отели' },
    { id: 'flights' as const, icon: Plane, label: 'Авиабилеты' },
    { id: 'cars' as const, icon: Car, label: 'Авто' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-theme-primary">
      <SEOHead
        title="TravelHub - Найдите идеальное путешествие"
        description="Сравните цены от 500+ провайдеров. Бронируйте отели, авиабилеты и авто со скидкой до 50%. Кэшбэк до 5% за каждое бронирование."
        keywords={['бронирование отелей', 'дешевые авиабилеты', 'аренда авто', 'путешествия', 'туризм']}
        type="website"
      />
      <Header />

      <main id="main-content" className="flex-grow" role="main">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center hero-gradient noise-overlay overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl float" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl float-delayed" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl float" />
          </div>

          <div className="relative container mx-auto px-4 py-20">
            <div className="max-w-5xl mx-auto text-center text-white">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 mb-8 animate-fade-in-down backdrop-blur-xl bg-white/10 border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">Более 1 млн довольных путешественников</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-[0.9] tracking-tight animate-fade-in-up">
                Откройте мир
                <span className="block mt-2 bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  с TravelHub
                </span>
              </h1>

              <p className="text-xl md:text-2xl mb-12 text-white/80 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
                Сравните тысячи предложений, сэкономьте до 50% и получайте кэшбэк за каждое бронирование
              </p>

              {/* Search Widget */}
              <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl animate-fade-in-up animation-delay-300 backdrop-blur-2xl bg-white/90 dark:bg-dark-800/90">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-dark-700 rounded-2xl" role="tablist">
                  {tabConfig.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={activeTab === id}
                      onClick={() => handleTabChange(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-medium transition-all duration-300 ${
                        activeTab === id
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-dark-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                <SearchWidgetExtended onSearch={handleSearch} type={activeTab} />
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-8 mt-12 animate-fade-in-up animation-delay-500">
                {['500+ авиакомпаний', '1M+ отелей', 'Лучшие цены'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/70">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
            <svg viewBox="0 0 1440 120" className="w-full fill-theme-primary">
              <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H0V0Z" />
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-theme-primary">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <StatCard key={index} stat={stat} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Bento Grid Destinations */}
        <section className="py-20 bg-theme-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                Популярные направления
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-theme-primary">
                Куда отправимся?
              </h2>
              <p className="text-xl text-theme-secondary max-w-2xl mx-auto">
                Откройте для себя самые востребованные направления со специальными ценами
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto auto-rows-[200px] md:auto-rows-[220px]">
              <BentoCard destination={popularDestinations[0]!} size="large" index={0} />
              <BentoCard destination={popularDestinations[1]!} size="default" index={1} />
              <BentoCard destination={popularDestinations[2]!} size="default" index={2} />
              <BentoCard destination={popularDestinations[3]!} size="tall" index={3} />
              <BentoCard destination={popularDestinations[4]!} size="wide" index={4} />
              <BentoCard destination={popularDestinations[5]!} size="default" index={5} />
            </div>

            <div className="text-center mt-12">
              <Link
                to="/hotels"
                className="inline-flex items-center gap-2 btn-primary group"
              >
                <span className="relative z-10">Все направления</span>
                <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-theme-primary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 mb-4">
                Почему мы?
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-theme-primary">
                Путешествуйте умнее
              </h2>
              <p className="text-xl text-theme-secondary max-w-2xl mx-auto">
                Мы делаем планирование путешествий простым, быстрым и выгодным
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-theme-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                Отзывы
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-theme-primary">
                Нам доверяют
              </h2>
              <p className="text-xl text-theme-secondary">
                Более 50,000 довольных путешественников
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 animated-gradient opacity-90" />

          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />

          <div className="relative container mx-auto px-4 text-center text-white">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-shadow">
              Готовы к приключениям?
            </h2>
            <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-white/90">
              Присоединяйтесь к миллионам путешественников и откройте мир с TravelHub
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-2xl font-bold
                           hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Начать бесплатно
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/affiliate"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white
                           px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all duration-300"
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
