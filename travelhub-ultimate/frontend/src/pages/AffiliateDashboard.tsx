import React, { useState, useEffect, useCallback, memo, useId } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  MousePointer,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  UserPlus,
  ArrowRight,
  Settings,
  Wallet,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface AffiliateStats {
  clicks: number;
  conversions: number;
  conversionRate: string;
  directReferrals: number;
  totalReferrals: number;
  earnings: {
    pending: number;
    approved: number;
    paid: number;
    total: number;
  };
}

interface AffiliateData {
  id: string;
  referralCode: string;
  level: number;
  status: string;
  verified: boolean;
  totalEarnings: number;
  totalReferrals: number;
  totalClicks: number;
}

interface ReferralLink {
  type: string;
  url: string;
  description: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

/**
 * Affiliate dashboard - shows affiliate stats and referral links.
 */
const AffiliateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Unique IDs for accessibility
  const headingId = useId();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch dashboard data
      const response = await api.get<{
        success: boolean;
        data: {
          affiliate: AffiliateData;
          stats: AffiliateStats;
        };
      }>('/affiliate/dashboard');

      if (response.success && response.data) {
        setAffiliate(response.data.affiliate);
        setStats(response.data.stats);

        // Fetch referral links
        await fetchReferralLinks();

        logger.info('Affiliate dashboard loaded successfully');
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      // If 404, user is not registered as affiliate
      if (apiError.response?.status === 404) {
        setAffiliate(null);
      } else {
        logger.error('Failed to fetch affiliate dashboard', err);
        setError(apiError.response?.data?.message || 'Не удалось загрузить данные партнёра');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralLinks = async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          referralCode: string;
          links: ReferralLink[];
        };
      }>('/affiliate/links');

      if (response.success && response.data) {
        setReferralLinks(response.data.links);
      }
    } catch (err: unknown) {
      logger.error('Failed to fetch referral links', err);
    }
  };

  const handleRegisterAsAffiliate = async () => {
    setRegistering(true);
    setError('');

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          id: string;
          referralCode: string;
          status: string;
          level: number;
          verified: boolean;
        };
      }>('/affiliate/register', {});

      if (response.success) {
        // Refresh dashboard data
        await fetchDashboardData();
        logger.info('Registered as affiliate successfully');
      } else {
        setError(response.message || 'Failed to register');
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      logger.error('Failed to register as affiliate', err);
      setError(apiError.response?.data?.message || 'Не удалось зарегистрироваться. Попробуйте снова.');
    } finally {
      setRegistering(false);
    }
  };

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string = 'RUB'): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  const handleCloseError = useCallback(() => {
    setError('');
  }, []);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12" role="main" aria-label="Загрузка панели партнёра">
          <Container>
            <div className="text-center py-12" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" aria-hidden="true" />
              <p className="mt-4 text-gray-600">Загрузка панели партнёра...</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Authentication guard
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12" role="main" aria-label="Требуется авторизация">
          <Container>
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Войдите в систему</h2>
              <p className="text-gray-600 mb-6">
                Для доступа к партнёрской программе необходимо войти в систему.
              </p>
              <Button href="/login">Войти</Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Not registered as affiliate
  if (!affiliate) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12" role="main" aria-label="Регистрация партнёра">
          <Container>
            <div className="max-w-4xl mx-auto">
              <Card className="p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                    <UserPlus className="w-10 h-10 text-primary-600" aria-hidden="true" />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Станьте партнёром
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    Присоединяйтесь к нашей партнёрской программе и получайте комиссию с каждого бронирования по вашим реферальным ссылкам!
                  </p>
                </div>

                {error && (
                  <Card className="p-4 mb-6 bg-red-50 border-red-200" role="alert" aria-live="polite">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" aria-hidden="true" />
                        <span>{error}</span>
                      </div>
                      <button onClick={handleCloseError} className="text-red-600 hover:text-red-800 p-1" aria-label="Закрыть">
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </Card>
                )}

                {/* Benefits */}
                <section className="grid md:grid-cols-3 gap-6 mb-8" aria-label="Преимущества программы">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <DollarSign className="w-8 h-8 text-blue-600 mb-3" aria-hidden="true" />
                    <h3 className="font-bold text-gray-900 mb-2">Зарабатывайте</h3>
                    <p className="text-sm text-gray-700">
                      Получайте 5-10% комиссии с каждого бронирования от ваших рефералов
                    </p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <Users className="w-8 h-8 text-green-600 mb-3" aria-hidden="true" />
                    <h3 className="font-bold text-gray-900 mb-2">Создайте сеть</h3>
                    <p className="text-sm text-gray-700">
                      Создайте многоуровневую реферальную сеть и получайте доход от субпартнёров
                    </p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <TrendingUp className="w-8 h-8 text-purple-600 mb-3" aria-hidden="true" />
                    <h3 className="font-bold text-gray-900 mb-2">Отслеживайте</h3>
                    <p className="text-sm text-gray-700">
                      Аналитика в реальном времени и подробные отчёты
                    </p>
                  </Card>
                </section>

                {/* CTA */}
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={handleRegisterAsAffiliate}
                    loading={registering}
                    icon={<UserPlus className="w-5 h-5" />}
                  >
                    {registering ? 'Регистрация...' : 'Стать партнёром'}
                  </Button>
                  <p className="text-sm text-gray-600 mt-4">
                    Регистрация бесплатна и занимает меньше минуты
                  </p>
                </div>
              </Card>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Affiliate dashboard
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12" role="main" aria-labelledby={headingId}>
        <Container>
          {/* Header */}
          <header className="mb-8">
            <h1 id={headingId} className="text-4xl font-bold text-gray-900 mb-2">Панель партнёра</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-gray-600">
                Реферальный код:{' '}
                <span className="font-mono font-bold text-primary-600">{affiliate.referralCode}</span>
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  affiliate.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : affiliate.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {affiliate.status === 'active' ? 'АКТИВЕН' : affiliate.status === 'pending' ? 'ОЖИДАЕТ' : affiliate.status.toUpperCase()}
              </span>
              {affiliate.verified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  Верифицирован
                </span>
              )}
            </div>
          </header>

          {error && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200" role="alert" aria-live="polite">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
                <button onClick={handleCloseError} className="text-red-600 hover:text-red-800 p-1" aria-label="Закрыть">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </Card>
          )}

          {/* Stats Cards */}
          {stats && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" aria-label="Статистика">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Общий доход</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats.earnings.total)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" aria-hidden="true" />
                  </div>
                </div>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <dt>Ожидает:</dt>
                    <dd className="font-medium">{formatCurrency(stats.earnings.pending)}</dd>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <dt>Одобрено:</dt>
                    <dd className="font-medium text-green-600">
                      {formatCurrency(stats.earnings.approved)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <dt>Выплачено:</dt>
                    <dd className="font-medium">{formatCurrency(stats.earnings.paid)}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Всего рефералов</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Прямые рефералы: <span className="font-medium">{stats.directReferrals}</span>
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Всего кликов</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.clicks}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MousePointer className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Конверсия</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {stats.conversions} конверсий
                </p>
              </Card>
            </section>
          )}

          {/* Referral Links */}
          {referralLinks.length > 0 && (
            <section className="mb-8" aria-label="Реферальные ссылки">
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ваши реферальные ссылки</h2>
                <div className="space-y-3">
                  {referralLinks.map((link) => (
                    <div key={link.type} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex-1 min-w-0">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          {link.description}
                        </label>
                        <input
                          type="text"
                          value={link.url}
                          readOnly
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
                          aria-label={`Ссылка ${link.description}`}
                        />
                      </div>
                      <div className="flex gap-2 pt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(link.url, link.type)}
                          icon={
                            copiedLink === link.type ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )
                          }
                          aria-label={copiedLink === link.type ? 'Скопировано' : 'Копировать ссылку'}
                        >
                          {copiedLink === link.type ? 'Скопировано!' : 'Копировать'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                          icon={<ExternalLink className="w-4 h-4" />}
                          aria-label="Открыть в новой вкладке"
                        >
                          Открыть
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}

          {/* Quick Actions */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Быстрые действия">
            <Card
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/affiliate/referrals')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/affiliate/referrals')}
            >
              <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 text-primary-600" aria-hidden="true" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Реферальная сеть</h3>
              <p className="text-gray-600 text-sm">
                Просмотр дерева рефералов и субпартнёров
              </p>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/affiliate/payouts')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/affiliate/payouts')}
            >
              <div className="flex items-center justify-between mb-3">
                <Wallet className="w-8 h-8 text-green-600" aria-hidden="true" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Выплаты</h3>
              <p className="text-gray-600 text-sm">
                История выплат и запрос на вывод средств
              </p>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/affiliate/portal')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/affiliate/portal')}
            >
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-8 h-8 text-blue-600" aria-hidden="true" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Статистика</h3>
              <p className="text-gray-600 text-sm">
                Подробная аналитика и ежемесячные отчёты о доходах
              </p>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/affiliate/settings')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/affiliate/settings')}
            >
              <div className="flex items-center justify-between mb-3">
                <Settings className="w-8 h-8 text-purple-600" aria-hidden="true" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Настройки</h3>
              <p className="text-gray-600 text-sm">
                Настройка платёжных реквизитов и уведомлений
              </p>
            </Card>
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(AffiliateDashboard);
