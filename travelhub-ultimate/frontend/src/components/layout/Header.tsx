import { Link } from 'react-router-dom';
import { User, Menu, X, Heart, Bell, Globe, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Track scroll position for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
      if (userMenuOpen) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen, userMenuOpen]);

  // Mock user state (replace with actual auth later)
  const isAuthenticated = false; // TODO: Get from auth context
  const unreadNotifications = 3;

  const navLinks = [
    { name: 'Отели', href: '/hotels/search', icon: '🏨' },
    { name: 'Авиабилеты', href: '/flights/search', icon: '✈️' },
    { name: 'Аренда авто', href: '/cars', icon: '🚗' },
    { name: 'Мои поездки', href: '/bookings', icon: '🎒' }
  ];

  return (
    <header
      className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
          >
            <span className="text-3xl">✈️</span>
            TravelHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700 hover:text-blue-600"
              >
                <span>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Selector */}
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">RU</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Currency Selector */}
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
              <span className="text-sm font-medium">USD</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <>
                {/* Favorites */}
                <Link
                  to="/favorites"
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-blue-600"
                >
                  <Heart className="w-6 h-6" />
                </Link>

                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-blue-600"
                >
                  <Bell className="w-6 h-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">Иван Петров</p>
                        <p className="text-sm text-gray-500">ivan@example.com</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        Личный кабинет
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        Мой профиль
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        Настройки
                      </Link>
                      <Link
                        to="/affiliate"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        Партнерская программа
                      </Link>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-red-600">
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-2 rounded-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all hover:scale-105"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-6 animate-slideDown">
            <div className="flex flex-col gap-2 mt-4">
              {/* Main Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium text-gray-700">{link.name}</span>
                </Link>
              ))}

              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* User Links */}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/favorites"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Избранное</span>
                  </Link>
                  <Link
                    to="/notifications"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Уведомления</span>
                    {unreadNotifications > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Личный кабинет</span>
                  </Link>
                  <Link
                    to="/affiliate"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-xl">💰</span>
                    <span className="font-medium text-gray-700">Партнерская программа</span>
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left text-red-600">
                    <span className="text-xl">🚪</span>
                    <span className="font-medium">Выйти</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-3 rounded-lg font-medium text-center text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-center hover:shadow-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
