import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'О нас', href: '/about' },
      { name: 'Карьера', href: '/careers' },
      { name: 'Пресс-центр', href: '/press' },
      { name: 'Блог', href: '/blog' }
    ],
    services: [
      { name: 'Отели', href: '/hotels/search' },
      { name: 'Авиабилеты', href: '/flights/search' },
      { name: 'Аренда авто', href: '/cars' },
      { name: 'Страхование', href: '/insurance' }
    ],
    support: [
      { name: 'Помощь', href: '/support' },
      { name: 'Связаться с нами', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Отмена бронирования', href: '/cancellation' }
    ],
    partner: [
      { name: 'Партнерская программа', href: '/affiliate' },
      { name: 'Стать партнером', href: '/affiliate/register' },
      { name: 'Условия партнерства', href: '/affiliate/terms' },
      { name: 'Выплаты', href: '/affiliate/payouts' }
    ],
    legal: [
      { name: 'Условия использования', href: '/terms' },
      { name: 'Политика конфиденциальности', href: '/privacy' },
      { name: 'Cookies', href: '/cookies' },
      { name: 'Безопасность', href: '/security' }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/travelhub', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/travelhub', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/travelhub', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/travelhub', label: 'YouTube' }
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <Link to="/" className="text-3xl font-bold text-white mb-4 inline-block">
              TravelHub
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Ваш надежный помощник в планировании путешествий. Сравниваем тысячи предложений, чтобы найти лучшие цены на отели, авиабилеты и аренду автомобилей.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href="mailto:support@travelhub.com" className="hover:text-white transition-colors">
                  support@travelhub.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-blue-400" />
                <a href="tel:+78001234567" className="hover:text-white transition-colors">
                  +7 (800) 123-45-67
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Москва, Россия</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Компания</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Сервисы</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Поддержка</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partner Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Партнерам</h3>
            <ul className="space-y-3">
              {footerLinks.partner.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Подпишитесь на нашу рассылку
            </h3>
            <p className="text-gray-400 mb-6">
              Получайте лучшие предложения и эксклюзивные скидки первыми
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Ваш email"
                className="flex-1 px-6 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Подписаться
              </button>
            </form>
          </div>
        </div>

        {/* Social Links & Legal */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="text-sm text-gray-400 text-center md:text-left">
              <p>&copy; {currentYear} TravelHub. Все права защищены.</p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {footerLinks.legal.map((link, index) => (
                <span key={link.name} className="flex items-center gap-4">
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                  {index < footerLinks.legal.length - 1 && (
                    <span className="text-gray-700">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-gray-800 bg-gray-950 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Безопасные платежи</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Защита данных SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Поддержка 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Гарантия лучшей цены</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
