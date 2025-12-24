import React, { memo, useId } from 'react';
import { FileText } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';

/**
 * Terms of Service page.
 */
const Terms: React.FC = () => {
  const headingId = useId();
  const lastUpdated = '21 декабря 2024';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Условия использования"
      >
        <Container>
          <div className="max-w-4xl mx-auto">
            <header className="mb-8 text-center">
              <FileText className="w-16 h-16 text-primary-600 mx-auto mb-4" aria-hidden="true" />
              <h1 id={headingId} className="text-4xl font-bold text-gray-900 mb-2">
                Условия использования
              </h1>
              <p className="text-gray-600">
                <time dateTime="2024-12-21">Последнее обновление: {lastUpdated}</time>
              </p>
            </header>

            <Card className="p-8">
              <article className="prose max-w-none" aria-labelledby={headingId}>
                <section aria-labelledby="terms-section-1">
                  <h2 id="terms-section-1">1. Принятие условий</h2>
                  <p>
                    Используя TravelHub, вы соглашаетесь с настоящими Условиями
                    использования. Если вы не согласны с какими-либо положениями,
                    пожалуйста, не используйте наш сервис.
                  </p>
                </section>

                <section aria-labelledby="terms-section-2">
                  <h2 id="terms-section-2">2. Описание сервиса</h2>
                  <p>
                    TravelHub - это платформа для поиска и бронирования отелей и
                    авиабилетов. Мы агрегируем предложения от различных провайдеров
                    для вашего удобства.
                  </p>
                </section>

                <section aria-labelledby="terms-section-3">
                  <h2 id="terms-section-3">3. Учётная запись пользователя</h2>
                  <p>
                    Для использования некоторых функций вам необходимо создать
                    учётную запись. Вы несёте ответственность за сохранность своих
                    учётных данных.
                  </p>
                </section>

                <section aria-labelledby="terms-section-4">
                  <h2 id="terms-section-4">4. Бронирование и оплата</h2>
                  <p>
                    Все цены указаны в соответствующей валюте и могут изменяться.
                    Окончательная стоимость подтверждается при бронировании.
                  </p>
                </section>

                <section aria-labelledby="terms-section-5">
                  <h2 id="terms-section-5">5. Отмена и возврат средств</h2>
                  <p>
                    Политика отмены зависит от выбранного отеля или авиакомпании.
                    Подробности указываются при бронировании.
                  </p>
                </section>

                <section aria-labelledby="terms-section-6">
                  <h2 id="terms-section-6">6. Ограничение ответственности</h2>
                  <p>
                    TravelHub не несёт ответственности за действия третьих лиц
                    (отелей, авиакомпаний и других провайдеров услуг).
                  </p>
                </section>

                <section aria-labelledby="terms-section-7">
                  <h2 id="terms-section-7">7. Изменение условий</h2>
                  <p>
                    Мы оставляем за собой право изменять настоящие Условия в любое
                    время. Продолжение использования сервиса означает согласие с
                    изменениями.
                  </p>
                </section>

                <section aria-labelledby="terms-section-8">
                  <h2 id="terms-section-8">8. Контактная информация</h2>
                  <p>
                    По вопросам, связанным с Условиями использования, свяжитесь с
                    нами по адресу:{' '}
                    <a
                      href="mailto:support@travelhub.com"
                      className="text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                    >
                      support@travelhub.com
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

export default memo(Terms);
