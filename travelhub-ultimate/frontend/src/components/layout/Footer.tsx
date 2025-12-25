import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { memo, useMemo, useId, useState, useCallback } from 'react';

/**
 * Footer component with improved accessibility (ARIA attributes, proper navigation structure).
 * Uses React.memo for performance optimization.
 */
function Footer() {
  const currentYear = new Date().getFullYear();
  const newsletterId = useId();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Memoize static footer links
  const footerLinks = useMemo(() => ({
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
  }), []);

  // Memoize social links
  const socialLinks = useMemo(() => [
    { icon: Facebook, href: 'https://facebook.com/travelhub', label: 'Следите за нами в Facebook' },
    { icon: Twitter, href: 'https://twitter.com/travelhub', label: 'Следите за нами в Twitter' },
    { icon: Instagram, href: 'https://instagram.com/travelhub', label: 'Следите за нами в Instagram' },
    { icon: Youtube, href: 'https://youtube.com/travelhub', label: 'Подпишитесь на наш YouTube канал' }
  ], []);

  // Handle newsletter subscription
  const handleNewsletterSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // In a real app, this would call an API
      setSubscribed(true);
      setEmail('');
    }
  }, [email]);

  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="text-3xl font-bold text-white mb-4 inline-block hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label="TravelHub - На главную"
            >
              TravelHub
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Ваш надежный помощник в планировании путешествий. Сравниваем тысячи предложений, чтобы найти лучшие цены на отели, авиабилеты и аренду автомобилей.
            </p>

            {/* Contact Info */}
            <address className="space-y-3 not-italic">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-blue-400" aria-hidden="true" />
                <a
                  href="mailto:support@travelhub.com"
                  className="hover:text-white transition-colors focus:outline-none focus-visible:underline"
                >
                  support@travelhub.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-blue-400" aria-hidden="true" />
                <a
                  href="tel:+78001234567"
                  className="hover:text-white transition-colors focus:outline-none focus-visible:underline"
                >
                  +7 (800) 123-45-67
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-blue-400" aria-hidden="true" />
                <span>Москва, Россия</span>
              </div>
            </address>
          </div>

          {/* Company Links */}
          <nav aria-labelledby="footer-company-heading">
            <h3 id="footer-company-heading" className="text-white font-semibold mb-4 text-lg">Компания</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block focus:outline-none focus-visible:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services Links */}
          <nav aria-labelledby="footer-services-heading">
            <h3 id="footer-services-heading" className="text-white font-semibold mb-4 text-lg">Сервисы</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block focus:outline-none focus-visible:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support Links */}
          <nav aria-labelledby="footer-support-heading">
            <h3 id="footer-support-heading" className="text-white font-semibold mb-4 text-lg">Поддержка</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block focus:outline-none focus-visible:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Partner Links */}
          <nav aria-labelledby="footer-partner-heading">
            <h3 id="footer-partner-heading" className="text-white font-semibold mb-4 text-lg">Партнерам</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.partner.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block focus:outline-none focus-visible:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Newsletter Subscription */}
        <section className="bg-gray-800 rounded-2xl p-8 mb-12" aria-labelledby={`${newsletterId}-heading`}>
          <div className="max-w-3xl mx-auto text-center">
            <h3 id={`${newsletterId}-heading`} className="text-2xl font-bold text-white mb-3">
              Подпишитесь на нашу рассылку
            </h3>
            <p id={`${newsletterId}-desc`} className="text-gray-400 mb-6">
              Получайте лучшие предложения и эксклюзивные скидки первыми
            </p>
            {subscribed ? (
              <div
                className="bg-green-900/50 border border-green-700 text-green-300 px-6 py-4 rounded-xl max-w-md mx-auto"
                role="status"
                aria-live="polite"
              >
                Спасибо за подписку! Проверьте вашу почту.
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                aria-describedby={`${newsletterId}-desc`}
              >
                <label htmlFor={`${newsletterId}-email`} className="sr-only">
                  Email для подписки
                </label>
                <input
                  id={`${newsletterId}-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ваш email"
                  required
                  autoComplete="email"
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-required="true"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                >
                  Подписаться
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Social Links & Legal */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="text-sm text-gray-400 text-center md:text-left">
              <p>&copy; {currentYear} TravelHub. Все права защищены.</p>
            </div>

            {/* Social Icons */}
            <nav aria-label="Социальные сети">
              <ul className="flex items-center gap-4" role="list">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Legal Links */}
            <nav aria-label="Юридическая информация">
              <ul className="flex flex-wrap items-center gap-4 text-sm" role="list">
                {footerLinks.legal.map((link, index) => (
                  <li key={link.name} className="flex items-center gap-4">
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:underline"
                    >
                      {link.name}
                    </Link>
                    {index < footerLinks.legal.length - 1 && (
                      <span className="text-gray-700" aria-hidden="true">•</span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-gray-800 bg-gray-950 py-6">
        <div className="container mx-auto px-4">
          <ul
            className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
            role="list"
            aria-label="Наши гарантии"
          >
            <li className="flex items-center gap-2">
              <span className="text-green-400" aria-hidden="true">✓</span>
              <span>Безопасные платежи</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400" aria-hidden="true">✓</span>
              <span>Защита данных SSL</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400" aria-hidden="true">✓</span>
              <span>Поддержка 24/7</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400" aria-hidden="true">✓</span>
              <span>Гарантия лучшей цены</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
