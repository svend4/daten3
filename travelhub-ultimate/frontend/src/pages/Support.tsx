import React, { useState, useCallback, memo, useId } from 'react';
import { HelpCircle, Mail, MessageSquare, Phone, Send, CheckCircle, AlertCircle, User } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { z } from 'zod';

// Validation schema for support form
const supportFormSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  subject: z.string().min(5, 'Тема должна содержать минимум 5 символов'),
  message: z.string().min(20, 'Сообщение должно содержать минимум 20 символов'),
});

interface SupportFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

/**
 * Support page with contact form and FAQ.
 */
const Support: React.FC = () => {
  const [formData, setFormData] = useState<SupportFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Unique IDs for accessibility
  const headingId = useId();
  const formId = useId();
  const contactFormId = useId();
  const faqSectionId = useId();
  const messageFieldId = useId();
  const successId = useId();
  const errorAlertId = useId();

  const handleInputChange = useCallback((field: keyof SupportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear general error
    if (error) {
      setError('');
    }
  }, [formErrors, error]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const result = supportFormSchema.safeParse(formData);
    if (!result.success) {
      const errors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        errors[field] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setError('');
    setFormErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError('Не удалось отправить сообщение. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const handleStartChat = useCallback(() => {
    // Placeholder for chat functionality
    console.log('Starting chat...');
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-grow bg-gray-50 py-12"
        role="main"
        aria-label="Служба поддержки"
      >
        <Container>
          {/* Header */}
          <header className="text-center mb-12">
            <HelpCircle className="w-16 h-16 text-primary-600 mx-auto mb-4" aria-hidden="true" />
            <h1 id={headingId} className="text-4xl font-bold text-gray-900 mb-2">
              Служба поддержки
            </h1>
            <p className="text-xl text-gray-600">
              Мы всегда готовы помочь вам
            </p>
          </header>

          {/* Contact Options */}
          <section aria-label="Способы связи" className="mb-12">
            <ul className="grid md:grid-cols-3 gap-6" role="list">
              <li>
                <Card className="p-6 text-center h-full">
                  <Mail className="w-12 h-12 text-primary-600 mx-auto mb-4" aria-hidden="true" />
                  <h2 className="text-lg font-bold mb-2">Email</h2>
                  <a
                    href="mailto:support@travelhub.com"
                    className="text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                  >
                    support@travelhub.com
                  </a>
                  <p className="text-sm text-gray-500 mt-2">
                    Ответ в течение 24 часов
                  </p>
                </Card>
              </li>

              <li>
                <Card className="p-6 text-center h-full">
                  <Phone className="w-12 h-12 text-primary-600 mx-auto mb-4" aria-hidden="true" />
                  <h2 className="text-lg font-bold mb-2">Телефон</h2>
                  <a
                    href="tel:+78001234567"
                    className="text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                  >
                    +7 (800) 123-45-67
                  </a>
                  <p className="text-sm text-gray-500 mt-2">
                    Пн-Пт: 9:00 - 21:00
                  </p>
                </Card>
              </li>

              <li>
                <Card className="p-6 text-center h-full">
                  <MessageSquare className="w-12 h-12 text-primary-600 mx-auto mb-4" aria-hidden="true" />
                  <h2 className="text-lg font-bold mb-2">Онлайн-чат</h2>
                  <p className="text-gray-600">Круглосуточно</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleStartChat}
                    icon={<MessageSquare className="w-4 h-4" />}
                  >
                    Начать чат
                  </Button>
                </Card>
              </li>
            </ul>
          </section>

          {/* Contact Form */}
          <section aria-labelledby={contactFormId} className="mb-12">
            <Card className="p-8 max-w-2xl mx-auto">
              <h2 id={contactFormId} className="text-2xl font-bold text-gray-900 mb-6">
                Свяжитесь с нами
              </h2>

              {/* Success Message */}
              {success && (
                <div
                  className="p-4 mb-6 bg-green-50 border border-green-200 rounded-lg"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" aria-hidden="true" />
                    <span id={successId}>
                      Ваше сообщение отправлено! Мы свяжемся с вами в ближайшее время.
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div
                  className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" aria-hidden="true" />
                    <span id={errorAlertId}>{error}</span>
                  </div>
                </div>
              )}

              <form
                id={formId}
                onSubmit={handleSubmit}
                className="space-y-6"
                aria-label="Форма обратной связи"
              >
                <Input
                  label="Ваше имя"
                  name="name"
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  required
                  icon={<User className="w-5 h-5" />}
                  error={formErrors.name}
                  placeholder="Иван Иванов"
                />

                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  required
                  icon={<Mail className="w-5 h-5" />}
                  error={formErrors.email}
                  placeholder="ivan@example.com"
                />

                <Input
                  label="Тема"
                  name="subject"
                  value={formData.subject}
                  onChange={(value) => handleInputChange('subject', value)}
                  required
                  error={formErrors.subject}
                  placeholder="Вопрос о бронировании"
                />

                <div>
                  <label
                    htmlFor={messageFieldId}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Сообщение <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id={messageFieldId}
                    name="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={6}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      formErrors.message
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.message}
                    aria-describedby={formErrors.message ? `${messageFieldId}-error` : undefined}
                    placeholder="Опишите ваш вопрос или проблему..."
                  />
                  {formErrors.message && (
                    <p
                      id={`${messageFieldId}-error`}
                      className="mt-1 text-sm text-red-600"
                      role="alert"
                    >
                      {formErrors.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  icon={<Send className="w-5 h-5" />}
                >
                  Отправить сообщение
                </Button>
              </form>
            </Card>
          </section>

          {/* FAQ Section */}
          <section aria-labelledby={faqSectionId}>
            <h2 id={faqSectionId} className="text-2xl font-bold text-center mb-8">
              Часто задаваемые вопросы
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <FAQCard
                question="Как отменить бронирование?"
                answer="Войдите в личный кабинет, откройте раздел «Мои бронирования» и нажмите «Отменить» напротив нужного бронирования."
              />

              <FAQCard
                question="Как изменить дату поездки?"
                answer="Свяжитесь с нашей службой поддержки. Возможность изменения зависит от условий выбранного тарифа."
              />

              <FAQCard
                question="Как получить чек?"
                answer="Электронный чек отправляется на ваш email сразу после оплаты. Также его можно скачать в личном кабинете."
              />

              <FAQCard
                question="Безопасны ли мои данные?"
                answer="Да, мы используем современные методы шифрования и соблюдаем все стандарты безопасности для защиты ваших данных."
              />
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

interface FAQCardProps {
  question: string;
  answer: string;
}

/**
 * FAQ card component.
 */
const FAQCard = memo(function FAQCard({ question, answer }: FAQCardProps) {
  return (
    <Card className="p-6">
      <article>
        <h3 className="font-bold mb-2 text-gray-900">{question}</h3>
        <p className="text-gray-600">{answer}</p>
      </article>
    </Card>
  );
});

export default memo(Support);
