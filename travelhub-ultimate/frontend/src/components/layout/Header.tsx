import { Link } from 'react-router-dom';
import { User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-heading font-bold text-primary-600">
            TravelHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/flights" className="hover:text-primary-600 transition-colors">
              Авиабилеты
            </Link>
            <Link to="/hotels" className="hover:text-primary-600 transition-colors">
              Отели
            </Link>
            <Link to="/search" className="hover:text-primary-600 transition-colors">
              Поиск
            </Link>
            <Link to="/bookings" className="hover:text-primary-600 transition-colors">
              Мои бронирования
            </Link>
            <Link to="/favorites" className="hover:text-primary-600 transition-colors">
              Избранное
            </Link>
            <Link to="/support" className="hover:text-primary-600 transition-colors">
              Поддержка
            </Link>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Регистрация
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Профиль</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t pt-4">
            <Link
              to="/flights"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Авиабилеты
            </Link>
            <Link
              to="/hotels"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Отели
            </Link>
            <Link
              to="/search"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Поиск
            </Link>
            <Link
              to="/bookings"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Мои бронирования
            </Link>
            <Link
              to="/favorites"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Избранное
            </Link>
            <Link
              to="/dashboard"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Личный кабинет
            </Link>
            <Link
              to="/profile"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Профиль
            </Link>
            <Link
              to="/settings"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Настройки
            </Link>
            <Link
              to="/reviews"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Отзывы
            </Link>
            <Link
              to="/affiliate/portal"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Партнерская программа
            </Link>
            <Link
              to="/support"
              className="block py-2 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Поддержка
            </Link>
            <div className="border-t pt-3 mt-3 space-y-2">
              <Link
                to="/login"
                className="block py-2 text-primary-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="block py-2 bg-primary-600 text-white text-center rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Регистрация
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
