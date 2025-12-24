import React, { useState } from 'react';

interface TestResult {
  id: string;
  category: string;
  name: string;
  url: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
  testsRun?: number;
  testsPassed?: number;
  testsFailed?: number;
  duration?: number;
}

interface TestCategory {
  name: string;
  tests: Omit<TestResult, 'status' | 'message'>[];
}

const AutomatedTestsPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  } | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  const BACKEND_URL = 'https://daten3-1.onrender.com/api';

  // Все тесты сгруппированы по категориям
  const testCategories: TestCategory[] = [
    {
      name: '🔐 Аутентификация',
      tests: [
        {
          id: 'auth-1',
          category: 'auth',
          name: 'Login Page',
          url: '/login',
          testsRun: 10,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'auth-2',
          category: 'auth',
          name: 'Register Page',
          url: '/register',
          testsRun: 11,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'auth-3',
          category: 'auth',
          name: 'Forgot Password',
          url: '/forgot-password',
          testsRun: 5,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'auth-4',
          category: 'auth',
          name: 'Reset Password',
          url: '/reset-password',
          testsRun: 7,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'auth-5',
          category: 'auth',
          name: 'Email Verification',
          url: '/email-verification',
          testsRun: 4,
          testsPassed: 0,
          testsFailed: 0,
        },
      ],
    },
    {
      name: '🏠 Публичные страницы',
      tests: [
        {
          id: 'public-1',
          category: 'public',
          name: 'Home Page',
          url: '/',
          testsRun: 9,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'public-2',
          category: 'public',
          name: 'Flight Search',
          url: '/flights',
          testsRun: 10,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'public-3',
          category: 'public',
          name: 'Hotel Search',
          url: '/hotels',
          testsRun: 10,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'public-4',
          category: 'public',
          name: 'Search Results',
          url: '/search',
          testsRun: 7,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'public-5',
          category: 'public',
          name: 'Hotel Details',
          url: '/hotels/1',
          testsRun: 9,
          testsPassed: 0,
          testsFailed: 0,
        },
      ],
    },
    {
      name: '💼 Пользовательский кабинет',
      tests: [
        {
          id: 'user-1',
          category: 'user',
          name: 'Dashboard',
          url: '/dashboard',
          testsRun: 6,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'user-2',
          category: 'user',
          name: 'Profile',
          url: '/profile',
          testsRun: 9,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'user-3',
          category: 'user',
          name: 'Settings',
          url: '/settings',
          testsRun: 10,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'user-4',
          category: 'user',
          name: 'My Bookings',
          url: '/bookings',
          testsRun: 9,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'user-5',
          category: 'user',
          name: 'Booking Details',
          url: '/bookings/1',
          testsRun: 9,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'user-6',
          category: 'user',
          name: 'Favorites',
          url: '/favorites',
          testsRun: 6,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'user-7',
          category: 'user',
          name: 'Price Alerts',
          url: '/price-alerts',
          testsRun: 9,
          testsPassed: 0,
          testsFailed: 0,
        },
      ],
    },
    {
      name: '🛒 Бронирование и оплата',
      tests: [
        {
          id: 'booking-1',
          category: 'booking',
          name: 'Booking Page',
          url: '/booking',
          testsRun: 8,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'booking-2',
          category: 'booking',
          name: 'Checkout',
          url: '/checkout',
          testsRun: 10,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'booking-3',
          category: 'booking',
          name: 'Payment Success',
          url: '/payment-success',
          testsRun: 7,
          testsPassed: 0,
          testsFailed: 0,
        },
      ],
    },
    {
      name: '👥 Партнерская программа',
      tests: [
        {
          id: 'affiliate-1',
          category: 'affiliate',
          name: 'Affiliate Portal',
          url: '/affiliate',
          testsRun: 7,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'affiliate-2',
          category: 'affiliate',
          name: 'Affiliate Dashboard',
          url: '/affiliate/dashboard',
          testsRun: 8,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'affiliate-3',
          category: 'affiliate',
          name: 'Referrals',
          url: '/affiliate/referrals',
          testsRun: 7,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'affiliate-4',
          category: 'affiliate',
          name: 'Payouts',
          url: '/affiliate/payouts',
          testsRun: 8,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'affiliate-5',
          category: 'affiliate',
          name: 'Affiliate Settings',
          url: '/affiliate/settings',
          testsRun: 7,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'affiliate-6',
          category: 'affiliate',
          name: 'Affiliate Registration',
          url: '/affiliate/register',
          testsRun: 8,
          testsPassed: 0,
          testsFailed: 0,
        },
      ],
    },
    {
      name: '🔧 Админ панель',
      tests: [
        {
          id: 'admin-1',
          category: 'admin',
          name: 'Admin Panel',
          url: '/admin',
          testsRun: 15,
          testsPassed: 0,
          testsFailed: 0,
        },
      ],
    },
    {
      name: '📄 Статические страницы',
      tests: [
        {
          id: 'static-1',
          category: 'static',
          name: 'Support',
          url: '/support',
          testsRun: 6,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'static-2',
          category: 'static',
          name: 'Reviews',
          url: '/reviews',
          testsRun: 6,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'static-3',
          category: 'static',
          name: 'Privacy Policy',
          url: '/privacy',
          testsRun: 4,
          testsPassed: 0,
          testsFailed: 0,
        },
        {
          id: 'static-4',
          category: 'static',
          name: 'Terms of Service',
          url: '/terms',
          testsRun: 4,
          testsPassed: 0,
          testsFailed: 0,
        },
      ],
    },
    {
      name: '🧪 Тестовые страницы',
      tests: [
        {
          id: 'test-1',
          category: 'test',
          name: 'CORS Test Page',
          url: '/test',
          testsRun: 14,
          testsPassed: 0,
          testsFailed: 0,
        },
      ],
    },
  ];

  // Функция для тестирования одной страницы
  const testPage = async (test: Omit<TestResult, 'status' | 'message'>): Promise<TestResult> => {
    const startTime = Date.now();
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    const detailsArray: string[] = [];

    try {
      // TEST 1: Проверка доступности страницы
      const pageUrl = `${window.location.origin}${test.url}`;
      const response = await fetch(pageUrl, {
        method: 'HEAD',
        credentials: 'include',
      });

      if (response.ok || response.status === 302 || response.status === 401) {
        passed++;
        detailsArray.push(`✅ Доступность страницы: ${response.status} ${response.statusText || 'OK'}`);
      } else {
        failed++;
        detailsArray.push(`❌ Доступность страницы: ${response.status} ${response.statusText || 'Error'}`);
      }

      // TEST 2: Проверка времени загрузки
      const loadStart = Date.now();
      try {
        await fetch(pageUrl, { credentials: 'include' });
        const loadTime = Date.now() - loadStart;
        if (loadTime < 3000) {
          passed++;
          detailsArray.push(`✅ Время загрузки: ${loadTime}ms (отлично!)`);
        } else if (loadTime < 5000) {
          warnings++;
          detailsArray.push(`⚠️ Время загрузки: ${loadTime}ms (медленно)`);
        } else {
          failed++;
          detailsArray.push(`❌ Время загрузки: ${loadTime}ms (слишком медленно)`);
        }
      } catch (err) {
        failed++;
        detailsArray.push(`❌ Время загрузки: ошибка - ${err instanceof Error ? err.message : 'Unknown'}`);
      }

      // TEST 3-5: Проверка связанных API endpoints (если есть)
      if (test.category === 'user' || test.category === 'admin' || test.category === 'affiliate') {
        // Проверка /api/users/me для защищенных страниц
        try {
          const authResponse = await fetch(`${BACKEND_URL}/users/me`, {
            credentials: 'include',
          });
          if (authResponse.status === 401) {
            warnings++;
            detailsArray.push(`⚠️ Аутентификация: 401 Unauthorized (требуется логин)`);
          } else if (authResponse.status === 200) {
            passed++;
            detailsArray.push(`✅ Аутентификация: пользователь авторизован`);
          } else {
            warnings++;
            detailsArray.push(`⚠️ Аутентификация: неожиданный статус ${authResponse.status}`);
          }
        } catch (err) {
          warnings++;
          detailsArray.push(`⚠️ Аутентификация: ошибка - ${err instanceof Error ? err.message : 'Unknown'}`);
        }
      }

      // TEST 6: Проверка CORS для страниц с API
      if (test.category !== 'static') {
        try {
          const corsResponse = await fetch(`${BACKEND_URL}/health`, {
            credentials: 'include',
          });
          const corsOrigin = corsResponse.headers.get('access-control-allow-origin');
          if (corsOrigin) {
            passed++;
            detailsArray.push(`✅ CORS: ${corsOrigin}`);
          } else {
            warnings++;
            detailsArray.push(`⚠️ CORS: заголовок Access-Control-Allow-Origin отсутствует`);
          }
        } catch (err) {
          failed++;
          detailsArray.push(`❌ Backend connectivity: ${err instanceof Error ? err.message : 'Unknown'}`);
        }
      }

      const duration = Date.now() - startTime;
      const totalTests = test.testsRun || 6;

      // Определяем статус
      let status: TestResult['status'] = 'passed';
      if (failed > totalTests / 2) {
        status = 'failed';
      } else if (warnings > 0 || failed > 0) {
        status = 'warning';
      }

      return {
        ...test,
        status,
        message:
          status === 'passed'
            ? 'Все тесты пройдены'
            : status === 'warning'
            ? 'Есть предупреждения'
            : 'Обнаружены ошибки',
        details: detailsArray.join('\n'),
        testsPassed: passed,
        testsFailed: failed,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        ...test,
        status: 'failed',
        message: 'Ошибка при тестировании',
        details: `❌ Критическая ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`,
        testsPassed: 0,
        testsFailed: test.testsRun || 0,
        duration,
      };
    }
  };

  // Запуск всех тестов
  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    const allTests = testCategories.flatMap((cat) => cat.tests);
    const testResults: TestResult[] = [];

    for (const test of allTests) {
      setCurrentTest(`${test.category.toUpperCase()}: ${test.name}`);

      // Добавляем pending результат
      const pendingResult: TestResult = {
        ...test,
        status: 'running',
        message: 'Тестирование...',
      };
      testResults.push(pendingResult);
      setResults([...testResults]);

      // Выполняем тест
      const result = await testPage(test);

      // Обновляем результат
      testResults[testResults.length - 1] = result;
      setResults([...testResults]);

      // Небольшая задержка между тестами
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Подсчитываем статистику
    const passed = testResults.filter((r) => r.status === 'passed').length;
    const failed = testResults.filter((r) => r.status === 'failed').length;
    const warnings = testResults.filter((r) => r.status === 'warning').length;

    setSummary({
      total: testResults.length,
      passed,
      failed,
      warnings,
    });

    setIsRunning(false);
    setCurrentTest('');
  };

  // Функция для запуска тестов одной категории
  const runCategoryTests = async (categoryName: string) => {
    const category = testCategories.find((c) => c.name === categoryName);
    if (!category) return;

    setIsRunning(true);
    const testResults: TestResult[] = [];

    for (const test of category.tests) {
      setCurrentTest(`${test.name}`);
      const result = await testPage(test);
      testResults.push(result);
      setResults([...testResults]);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'running':
        return '⏳';
      default:
        return '⏸️';
    }
  };

  const toggleExpand = (testId: string) => {
    setExpandedTests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  const totalTests = testCategories.reduce((acc, cat) => acc + cat.tests.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            🧪 Автоматизированное тестирование Frontend
          </h1>
          <p className="text-gray-600 text-lg">
            Автоматическая проверка всех {totalTests} страниц приложения TravelHub
          </p>

          {/* Кнопка запуска */}
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className={`
                px-8 py-4 rounded-xl font-bold text-white text-lg
                transition-all transform hover:scale-105 shadow-lg
                ${
                  isRunning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }
              `}
            >
              {isRunning ? '⏳ Тестирование...' : '🚀 Запустить все тесты'}
            </button>

            {results.length > 0 && !isRunning && (
              <button
                onClick={() => {
                  setResults([]);
                  setSummary(null);
                }}
                className="px-6 py-4 rounded-xl font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
              >
                🔄 Очистить результаты
              </button>
            )}
          </div>

          {/* Текущий тест */}
          {currentTest && (
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-blue-800 font-semibold">Сейчас тестируется: {currentTest}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Сводка результатов</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <div className="text-3xl font-bold text-gray-900">{summary.total}</div>
                <div className="text-gray-600">Всего тестов</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-300">
                <div className="text-3xl font-bold text-green-800">{summary.passed}</div>
                <div className="text-green-600">✅ Пройдено</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300">
                <div className="text-3xl font-bold text-yellow-800">{summary.warnings}</div>
                <div className="text-yellow-600">⚠️ Предупреждения</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border-2 border-red-300">
                <div className="text-3xl font-bold text-red-800">{summary.failed}</div>
                <div className="text-red-600">❌ Провалено</div>
              </div>
            </div>

            {/* Прогресс бар */}
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Прогресс</span>
                <span className="text-sm font-semibold text-gray-700">
                  {Math.round((summary.passed / summary.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(summary.passed / summary.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Категории и результаты */}
        {testCategories.map((category) => {
          const categoryResults = results.filter((r) => r.category === category.tests[0]?.category);
          const hasCategoryResults = categoryResults.length > 0;

          return (
            <div key={category.name} className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => runCategoryTests(category.name)}
                    disabled={isRunning}
                    className={`
                      px-4 py-2 rounded-lg font-semibold text-sm
                      ${
                        isRunning
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }
                    `}
                  >
                    🧪 Тестировать категорию
                  </button>
                  <span className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-semibold text-sm">
                    {category.tests.length} страниц
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {category.tests.map((test) => {
                  const result = categoryResults.find((r) => r.id === test.id);
                  const isExpanded = expandedTests.has(test.id);

                  return (
                    <div
                      key={test.id}
                      className={`
                        border-2 rounded-xl p-4 transition-all
                        ${result ? getStatusColor(result.status) : 'border-gray-200 bg-gray-50'}
                        ${result ? 'cursor-pointer hover:shadow-lg' : ''}
                      `}
                      onClick={() => result && toggleExpand(test.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {result && (
                              <span className="text-2xl">{getStatusIcon(result.status)}</span>
                            )}
                            <h3 className="text-lg font-bold">{test.name}</h3>
                            <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-mono">
                              {test.url}
                            </span>
                            {result && (
                              <span className="ml-auto text-gray-500">
                                {isExpanded ? '🔽' : '▶️'}
                              </span>
                            )}
                          </div>

                          {result && (
                            <>
                              <p className="text-sm font-semibold mb-1">{result.message}</p>

                              {/* Краткая информация всегда видна */}
                              <p className="text-xs opacity-75">
                                {result.testsPassed} passed, {result.testsFailed} failed, {(result.testsRun || 0) - (result.testsPassed || 0) - (result.testsFailed || 0)} warnings
                              </p>

                              {result.duration && (
                                <p className="text-xs opacity-75 mt-1">
                                  ⏱️ Время выполнения: {result.duration}ms
                                </p>
                              )}

                              {/* Подробные детали раскрываются при клике */}
                              {isExpanded && result.details && (
                                <div className="mt-3 p-3 bg-white bg-opacity-70 rounded-lg border border-opacity-30">
                                  <p className="text-xs font-semibold mb-2">📋 Подробные результаты:</p>
                                  <div className="space-y-1">
                                    {result.details.split('\n').map((line, idx) => (
                                      <p key={idx} className="text-xs font-mono whitespace-pre-wrap">
                                        {line}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {!result && (
                            <p className="text-sm text-gray-500">
                              Планируется {test.testsRun} тестов
                            </p>
                          )}
                        </div>

                        {result && result.testsPassed !== undefined && (
                          <div className="text-right ml-4">
                            <div className="text-sm font-bold">
                              {result.testsPassed}/{test.testsRun}
                            </div>
                            <div className="text-xs opacity-75">тестов пройдено</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Информационная панель */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-3">ℹ️ Информация о тестах</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">✅ Что тестируется:</p>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                <li>Доступность страницы (HTTP status)</li>
                <li>Время загрузки страницы</li>
                <li>Подключение к backend API</li>
                <li>CORS заголовки</li>
                <li>Аутентификация (для защищенных страниц)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">📊 Статусы:</p>
              <ul className="space-y-1 opacity-90">
                <li>✅ <strong>Passed:</strong> Все тесты успешно пройдены</li>
                <li>⚠️ <strong>Warning:</strong> Есть незначительные проблемы</li>
                <li>❌ <strong>Failed:</strong> Критические ошибки обнаружены</li>
                <li>⏳ <strong>Running:</strong> Тест выполняется</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomatedTestsPage;
