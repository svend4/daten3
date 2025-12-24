import React, { useState, useEffect, useCallback, useMemo, memo, useId } from 'react';
import { Users, TrendingUp, DollarSign, Award, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../store/AuthContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface PortalStats {
  totalAffiliates: number;
  monthlyGrowth: string;
  totalEarnings: number;
  topStatus: string;
}

interface AffiliateResponse {
  affiliate?: unknown;
}

/**
 * Affiliate portal page - information and registration for affiliate program.
 */
const AffiliatePortal: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [isAffiliate, setIsAffiliate] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Unique IDs for accessibility
  const heroId = useId();
  const howItWorksId = useId();
  const benefitsId = useId();
  const commissionId = useId();
  const faqId = useId();

  const stats = useMemo<PortalStats>(() => ({
    totalAffiliates: 1245,
    monthlyGrowth: '+15.3%',
    totalEarnings: 12450,
    topStatus: 'Gold',
  }), []);

  const checkAffiliateStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setCheckingStatus(false);
      return;
    }

    try {
      const response = await api.get<{
        success: boolean;
        data: AffiliateResponse;
      }>('/affiliate/dashboard');

      if (response.success && response.data?.affiliate) {
        setIsAffiliate(true);
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { status?: number } };
      if (apiError.response?.status === 404) {
        setIsAffiliate(false);
      }
      logger.debug('Affiliate status check', err);
    } finally {
      setCheckingStatus(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkAffiliateStatus();
  }, [checkAffiliateStatus]);

  const handleCTA = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/register', { state: { from: '/affiliate/portal' } });
    } else {
      navigate('/affiliate');
    }
  }, [isAuthenticated, navigate]);

  const getCTAText = useCallback((): string => {
    if (!isAuthenticated) {
      return 'Зарегистрироваться';
    } else if (isAffiliate) {
      return 'Перейти в личный кабинет';
    } else {
      return 'Стать партнером';
    }
  }, [isAuthenticated, isAffiliate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Партнерская программа"
      >
        <Container>
          {/* Hero Section */}
          <header className="text-center mb-12" aria-labelledby={heroId}>
            <h1 id={heroId} className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Партнерская программа TravelHub
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Зарабатывайте, делясь лучшими предложениями путешествий
            </p>
            {isAffiliate && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium"
                role="status"
              >
                <CheckCircle className="w-5 h-5" aria-hidden="true" />
                <span>Вы уже являетесь партнером!</span>
              </div>
            )}
          </header>

          {/* Stats Grid */}
          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" aria-label="Статистика программы">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" aria-hidden="true" />
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {stats.totalAffiliates.toLocaleString('ru-RU')}
              </p>
              <p className="text-gray-600">Активных партнеров</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" aria-hidden="true" />
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {stats.monthlyGrowth}
              </p>
              <p className="text-gray-600">Рост за месяц</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <DollarSign className="w-12 h-12 text-blue-600 mx-auto mb-4" aria-hidden="true" />
              <p className="text-2xl font-bold text-gray-900 mb-2">
                ${stats.totalEarnings.toLocaleString('ru-RU')}
              </p>
              <p className="text-gray-600">Средний доход партнера</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Award className="w-12 h-12 text-yellow-600 mx-auto mb-4" aria-hidden="true" />
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {stats.topStatus}
              </p>
              <p className="text-gray-600">Высший статус</p>
            </Card>
          </section>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* How It Works */}
            <Card className="p-8" aria-labelledby={howItWorksId}>
              <h2 id={howItWorksId} className="text-2xl font-bold text-gray-900 mb-6">
                Как это работает
              </h2>
              <ol className="space-y-6">
                <li className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg"
                    aria-hidden="true"
                  >
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Получите уникальную ссылку
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Зарегистрируйтесь в программе и получите персональную реферальную ссылку
                      для отслеживания ваших рефералов
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg"
                    aria-hidden="true"
                  >
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Делитесь с друзьями
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Рассказывайте о TravelHub в социальных сетях, на своем блоге,
                      в YouTube или просто делитесь с друзьями
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg"
                    aria-hidden="true"
                  >
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Получайте вознаграждение
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Зарабатывайте комиссию от 5% до 10% с каждого бронирования,
                      совершенного вашими рефералами
                    </p>
                  </div>
                </li>
              </ol>
            </Card>

            {/* Benefits */}
            <Card className="p-8 bg-gradient-to-br from-primary-50 to-white border-primary-100" aria-labelledby={benefitsId}>
              <h2 id={benefitsId} className="text-2xl font-bold text-gray-900 mb-6">
                Преимущества программы
              </h2>
              <ul className="space-y-4 mb-8" role="list">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                    ✓
                  </div>
                  <span className="text-gray-700">
                    <strong>Многоуровневая система:</strong> Комиссия от 5% до 10%
                    в зависимости от уровня реферала
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                    ✓
                  </div>
                  <span className="text-gray-700">
                    <strong>Пассивный доход:</strong> Получайте вознаграждение от всех
                    бронирований рефералов на протяжении всей жизни
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                    ✓
                  </div>
                  <span className="text-gray-700">
                    <strong>Удобные выплаты:</strong> Еженедельные выплаты на ваш счет
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                    ✓
                  </div>
                  <span className="text-gray-700">
                    <strong>Аналитика в реальном времени:</strong> Подробная статистика
                    кликов, конверсий и заработка
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                    ✓
                  </div>
                  <span className="text-gray-700">
                    <strong>Маркетинговые материалы:</strong> Готовые баннеры и тексты
                    для продвижения
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                    ✓
                  </div>
                  <span className="text-gray-700">
                    <strong>Поддержка 24/7:</strong> Персональный менеджер для топ-партнеров
                  </span>
                </li>
              </ul>

              <Button
                fullWidth
                size="lg"
                onClick={handleCTA}
                loading={checkingStatus}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                {getCTAText()}
              </Button>
            </Card>
          </div>

          {/* Commission Structure */}
          <section aria-labelledby={commissionId}>
            <Card className="p-8 mb-12">
              <h2 id={commissionId} className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Структура вознаграждений
              </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-4xl font-bold text-blue-600 mb-2">10%</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Уровень 1</div>
                <p className="text-sm text-gray-600">
                  От прямых рефералов (те, кто зарегистрировался по вашей ссылке)
                </p>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-4xl font-bold text-green-600 mb-2">7%</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Уровень 2</div>
                <p className="text-sm text-gray-600">
                  От рефералов второго уровня (рефералы ваших рефералов)
                </p>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 mb-2">5%</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Уровень 3+</div>
                <p className="text-sm text-gray-600">
                  От рефералов третьего уровня и глубже
                </p>
              </div>
            </div>
            </Card>
          </section>

          {/* FAQ Section */}
          <section aria-labelledby={faqId}>
            <Card className="p-8">
              <h2 id={faqId} className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Частые вопросы
              </h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Есть ли ограничения на количество рефералов?
                </h3>
                <p className="text-gray-600 text-sm">
                  Нет! Вы можете приглашать неограниченное количество рефералов и
                  получать вознаграждение от всех их бронирований.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Когда я получу свои выплаты?
                </h3>
                <p className="text-gray-600 text-sm">
                  Выплаты производятся еженедельно при минимальной сумме $50.
                  Вы можете запросить выплату в любое время через личный кабинет.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Нужен ли опыт в маркетинге?
                </h3>
                <p className="text-gray-600 text-sm">
                  Нет, специальные знания не требуются. Мы предоставляем все
                  необходимые материалы и инструкции для успешного старта.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Как отслеживать свою статистику?
                </h3>
                <p className="text-gray-600 text-sm">
                  В личном кабинете партнера доступна подробная статистика в реальном
                  времени: клики, конверсии, заработок и структура вашей сети.
                </p>
              </div>
            </div>
            </Card>
          </section>

          {/* Final CTA */}
          <section
            className="text-center mt-12 py-12 px-6 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl text-white"
            aria-label="Призыв к действию"
          >
            <h2 className="text-3xl font-bold mb-4">
              Готовы начать зарабатывать?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Присоединяйтесь к нашей партнерской программе уже сегодня!
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={handleCTA}
              loading={checkingStatus}
              className="bg-white text-primary-600 hover:bg-gray-100 border-white"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              {getCTAText()}
            </Button>
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(AffiliatePortal);
