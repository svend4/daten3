import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plane, Menu, X } from 'lucide-react';
import Container from '../Container/Container';
import Button from '@components/common/Button/Button';
import LanguageSwitcher from '@components/common/LanguageSwitcher/LanguageSwitcher';
import { useAuth } from '@store/AuthContext';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/flights', label: t('nav.flights') },
    { path: '/hotels', label: t('nav.hotels') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
      <Container>
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-700 transition-colors">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Travel<span className="text-primary-600">Hub</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  font-semibold transition-colors relative
                  ${isActive(link.path)
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeLink"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-600"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Button variant="primary" onClick={() => window.location.href = '/profile'}>
                {t('nav.profile')}
              </Button>
            ) : (
              <Button variant="primary">{t('nav.signIn')}</Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    font-semibold py-2 px-4 rounded-lg transition-colors
                    ${isActive(link.path)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-4">
                <LanguageSwitcher />
              </div>
              <Button variant="primary" fullWidth>
                {t('nav.signIn')}
              </Button>
            </nav>
          </motion.div>
        )}
      </Container>
    </header>
  );
};

export default Header;
