import React, { memo, useId } from 'react';
import { Shield } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';

/**
 * Privacy Policy page.
 */
const Privacy: React.FC = () => {
  const headingId = useId();
  const lastUpdated = '21 декабря 2024';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Политика конфиденциальности"
      >
        <Container>
          <div className="max-w-4xl mx-auto">
            <header className="mb-8 text-center">
              <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4" aria-hidden="true" />
              <h1 id={headingId} className="text-4xl font-bold text-gray-900 mb-2">
                Политика конфиденциальности
              </h1>
              <p className="text-gray-600">
                <time dateTime="2024-12-21">Последнее обновление: {lastUpdated}</time>
              </p>
            </header>

            <Card className="p-8">
              <article className="prose max-w-none" aria-labelledby={headingId}>
                <section aria-labelledby="privacy-section-1">
                  <h2 id="privacy-section-1">1. Сбор информации</h2>
                  <p>
                    Мы собираем информацию, которую вы предоставляете при регистрации,
                    бронировании или использовании нашего сервиса. Это включает ваше
                    имя, email, номер телефона и платёжную информацию.
                  </p>
                </section>

                <section aria-labelledby="privacy-section-2">
                  <h2 id="privacy-section-2">2. Использование информации</h2>
                  <p>
                    Мы используем вашу информацию для:
                  </p>
                  <ul>
                    <li>Обработки бронирований и платежей</li>
                    <li>Отправки подтверждений и уведомлений</li>
                    <li>Улучшения качества сервиса</li>
                    <li>Предотвращения мошенничества</li>
                  </ul>
                </section>

                <section aria-labelledby="privacy-section-3">
                  <h2 id="privacy-section-3">3. Защита данных</h2>
                  <p>
                    Мы применяем современные меры безопасности для защиты ваших
                    персональных данных. Все платежи обрабатываются через безопасные
                    платёжные шлюзы.
                  </p>
                </section>

                <section aria-labelledby="privacy-section-4">
                  <h2 id="privacy-section-4">4. Передача третьим лицам</h2>
                  <p>
                    Мы можем передавать вашу информацию партнёрам (отелям,
                    авиакомпаниям) только для выполнения бронирований. Мы не продаём
                    ваши данные третьим лицам в маркетинговых целях.
                  </p>
                </section>

                <section aria-labelledby="privacy-section-5">
                  <h2 id="privacy-section-5">5. Cookies</h2>
                  <p>
                    Мы используем cookies для улучшения вашего опыта использования
                    сайта. Вы можете отключить cookies в настройках браузера.
                  </p>
                </section>

                <section aria-labelledby="privacy-section-6">
                  <h2 id="privacy-section-6">6. Ваши права</h2>
                  <p>
                    Вы имеете право:
                  </p>
                  <ul>
                    <li>Получить доступ к своим данным</li>
                    <li>Исправить неточную информацию</li>
                    <li>Удалить свой аккаунт</li>
                    <li>Отозвать согласие на обработку данных</li>
                  </ul>
                </section>

                <section aria-labelledby="privacy-section-7">
                  <h2 id="privacy-section-7">7. Изменения в политике</h2>
                  <p>
                    Мы можем обновлять эту политику конфиденциальности. О существенных
                    изменениях мы будем сообщать по email.
                  </p>
                </section>

                <section aria-labelledby="privacy-section-8">
                  <h2 id="privacy-section-8">8. Контакты</h2>
                  <p>
                    По вопросам конфиденциальности свяжитесь с нами:{' '}
                    <a
                      href="mailto:privacy@travelhub.com"
                      className="text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                    >
                      privacy@travelhub.com
                    </a>
                  </p>
                </section>
              </article>
            </Card>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default memo(Privacy);
