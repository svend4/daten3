import { Link } from 'react-router-dom';
import { User, Menu, X, Heart, Bell, Globe, ChevronDown } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '../../store/AuthContext';

/**
 * Header component with improved accessibility (ARIA attributes, keyboard navigation).
 */
function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Refs for focus management
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get authentication state from context
  const { isAuthenticated, user, logout } = useAuth();

  // Track scroll position for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle Escape key to close menus
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (userMenuOpen) {
          setUserMenuOpen(false);
          userMenuButtonRef.current?.focus();
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          mobileMenuButtonRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [userMenuOpen, mobileMenuOpen]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const toggleUserMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setUserMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [logout]);

  const unreadNotifications = 3;

  const navLinks = [
    { name: 'Отели', href: '/hotels', icon: '🏨' },
    { name: 'Авиабилеты', href: '/flights', icon: '✈️' },
    { name: 'Мои поездки', href: '/bookings', icon: '🎒' },
  ];

  return (
    <header
      className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-lg' : 'shadow-sm'
      }`}
      role="banner"
    >
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg"
      >
        Перейти к основному содержимому
      </a>

      <div className="container mx-auto px-4">
        <nav
          className="flex items-center justify-between h-20"
          aria-label="Главная навигация"
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
            aria-label="TravelHub - На главную"
          >
            <span className="text-3xl" aria-hidden="true">✈️</span>
            TravelHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1" role="navigation">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <span aria-hidden="true">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Selector */}
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Выбор языка: Русский"
              aria-haspopup="listbox"
            >
              <Globe className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-medium">RU</span>
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Currency Selector */}
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Выбор валюты: USD"
              aria-haspopup="listbox"
            >
              <span className="text-sm font-medium">USD</span>
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>

            {isAuthenticated ? (
              <>
                {/* Favorites */}
                <Link
                  to="/favorites"
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label="Избранное"
                >
                  <Heart className="w-6 h-6" aria-hidden="true" />
                </Link>

                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label={`Уведомления${unreadNotifications > 0 ? `, ${unreadNotifications} непрочитанных` : ''}`}
                >
                  <Bell className="w-6 h-6" aria-hidden="true" />
                  {unreadNotifications > 0 && (
                    <span
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    ref={userMenuButtonRef}
                    onClick={toggleUserMenu}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Меню пользователя"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-600 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 animate-fadeIn"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 focus:outline-none focus:bg-gray-50"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Личный кабинет
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 focus:outline-none focus:bg-gray-50"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Мой профиль
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 focus:outline-none focus:bg-gray-50"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Настройки
                      </Link>
                      <Link
                        to="/affiliate"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 focus:outline-none focus:bg-gray-50"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Партнерская программа
                      </Link>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-red-600 focus:outline-none focus:bg-gray-50"
                          role="menuitem"
                        >
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
                  className="px-6 py-2 rounded-lg font-medium text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={mobileMenuButtonRef}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="lg:hidden pb-6 animate-slideDown"
            role="navigation"
            aria-label="Мобильное меню"
          >
            <div className="flex flex-col gap-2 mt-4">
              {/* Main Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100"
                  onClick={closeMobileMenu}
                >
                  <span className="text-xl" aria-hidden="true">{link.icon}</span>
                  <span className="font-medium text-gray-700">{link.name}</span>
                </Link>
              ))}

              {/* Divider */}
              <hr className="border-t border-gray-200 my-2" />

              {/* User Links */}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/favorites"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100"
                    onClick={closeMobileMenu}
                  >
                    <Heart className="w-5 h-5 text-gray-600" aria-hidden="true" />
                    <span className="font-medium text-gray-700">Избранное</span>
                  </Link>
                  <Link
                    to="/notifications"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100"
                    onClick={closeMobileMenu}
                  >
                    <Bell className="w-5 h-5 text-gray-600" aria-hidden="true" />
                    <span className="font-medium text-gray-700">Уведомления</span>
                    {unreadNotifications > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100"
                    onClick={closeMobileMenu}
                  >
                    <User className="w-5 h-5 text-gray-600" aria-hidden="true" />
                    <span className="font-medium text-gray-700">Личный кабинет</span>
                  </Link>
                  <Link
                    to="/affiliate"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100"
                    onClick={closeMobileMenu}
                  >
                    <span className="text-xl" aria-hidden="true">💰</span>
                    <span className="font-medium text-gray-700">Партнерская программа</span>
                  </Link>
                  <hr className="border-t border-gray-200 my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left text-red-600 focus:outline-none focus:bg-gray-100"
                  >
                    <span className="text-xl" aria-hidden="true">🚪</span>
                    <span className="font-medium">Выйти</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-3 rounded-lg font-medium text-center text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100"
                    onClick={closeMobileMenu}
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-center hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
                    onClick={closeMobileMenu}
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

export default memo(Header);
