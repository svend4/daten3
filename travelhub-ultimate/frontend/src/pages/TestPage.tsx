import React, { useState } from 'react';

interface TestResult {
  name: string;
  status: 'pending' | 'passed' | 'failed';
  message: string;
  details?: string;
}

const TestPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{ passed: number; total: number } | null>(null);

  const BACKEND_URL = 'https://daten3-1.onrender.com';
  const FRONTEND_URL = 'https://daten3.onrender.com';

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    const testResults: TestResult[] = [];
    let passed = 0;

    // TEST 1: Health Check
    testResults.push({
      name: 'Health Check',
      status: 'pending',
      message: 'Проверка доступности backend...',
    });
    setResults([...testResults]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/health`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        testResults[0] = {
          name: 'Health Check',
          status: 'passed',
          message: 'Backend доступен',
          details: `Status: ${response.status}, Data: ${JSON.stringify(data)}`,
        };
        passed++;
      } else {
        testResults[0] = {
          name: 'Health Check',
          status: 'failed',
          message: `Backend вернул ошибку: ${response.status}`,
        };
      }
    } catch (error) {
      testResults[0] = {
        name: 'Health Check',
        status: 'failed',
        message: 'Backend недоступен',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    setResults([...testResults]);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // TEST 2: CORS Headers
    testResults.push({
      name: 'CORS Headers',
      status: 'pending',
      message: 'Проверка CORS настроек...',
    });
    setResults([...testResults]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/health`, {
        method: 'GET',
        credentials: 'include',
      });

      const corsOrigin = response.headers.get('access-control-allow-origin');
      const corsCredentials = response.headers.get('access-control-allow-credentials');

      if (corsOrigin === FRONTEND_URL && corsCredentials === 'true') {
        testResults[1] = {
          name: 'CORS Headers',
          status: 'passed',
          message: 'CORS настроен правильно',
          details: `Origin: ${corsOrigin}, Credentials: ${corsCredentials}`,
        };
        passed++;
      } else {
        testResults[1] = {
          name: 'CORS Headers',
          status: 'failed',
          message: 'CORS настроен неправильно',
          details: `Origin: ${corsOrigin || 'null'} (ожидается ${FRONTEND_URL}), Credentials: ${corsCredentials || 'null'}`,
        };
      }
    } catch (error) {
      testResults[1] = {
        name: 'CORS Headers',
        status: 'failed',
        message: 'Ошибка при проверке CORS',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    setResults([...testResults]);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // TEST 3: CSRF Token
    testResults.push({
      name: 'CSRF Token',
      status: 'pending',
      message: 'Получение CSRF токена...',
    });
    setResults([...testResults]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.csrfToken) {
          testResults[2] = {
            name: 'CSRF Token',
            status: 'passed',
            message: 'CSRF токен получен',
            details: `Token: ${data.csrfToken.substring(0, 20)}...`,
          };
          passed++;
        } else {
          testResults[2] = {
            name: 'CSRF Token',
            status: 'failed',
            message: 'Токен не найден в ответе',
          };
        }
      } else {
        testResults[2] = {
          name: 'CSRF Token',
          status: 'failed',
          message: `Ошибка получения токена: ${response.status}`,
        };
      }
    } catch (error) {
      testResults[2] = {
        name: 'CSRF Token',
        status: 'failed',
        message: 'Ошибка при получении токена',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    setResults([...testResults]);
    setSummary({ passed, total: 3 });
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">🧪 Тест CORS</h1>
            <p className="text-gray-600 text-lg">
              Проверка подключения Frontend → Backend
            </p>
          </div>

          {/* Run Test Button */}
          <button
            onClick={runTests}
            disabled={isRunning}
            className={`w-full py-6 px-8 rounded-xl text-white text-2xl font-bold transition-all duration-200 ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-98 shadow-lg'
            }`}
          >
            {isRunning ? '⏳ Тестирование...' : '🚀 Запустить тест'}
          </button>

          {/* Test Results */}
          {results.length > 0 && (
            <div className="mt-8 space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 border-l-4 ${
                    result.status === 'pending'
                      ? 'bg-yellow-50 border-yellow-500'
                      : result.status === 'passed'
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">
                      {result.status === 'pending' && '⏳'}
                      {result.status === 'passed' && '✅'}
                      {result.status === 'failed' && '❌'}{' '}
                      ТЕСТ {index + 1}: {result.name}
                    </h3>
                    <span
                      className={`px-4 py-1 rounded-full text-sm font-semibold ${
                        result.status === 'pending'
                          ? 'bg-yellow-200 text-yellow-800'
                          : result.status === 'passed'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {result.status === 'pending' && 'ВЫПОЛНЯЕТСЯ'}
                      {result.status === 'passed' && 'ПРОЙДЕН'}
                      {result.status === 'failed' && 'ПРОВАЛЕН'}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{result.message}</p>
                  {result.details && (
                    <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
                      {result.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div
              className={`mt-8 rounded-2xl p-8 text-center ${
                summary.passed === summary.total
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-red-500 to-pink-500'
              } text-white`}
            >
              <div className="text-5xl mb-4">
                {summary.passed === summary.total ? '🎉' : '❌'}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {summary.passed === summary.total
                  ? 'ВСЁ РАБОТАЕТ!'
                  : 'Обнаружены проблемы'}
              </h2>
              <p className="text-xl mb-4">
                {summary.passed}/{summary.total} тестов пройдено
              </p>
              {summary.passed === summary.total ? (
                <div className="text-lg">
                  <p>✅ Frontend успешно подключен к Backend</p>
                  <p>✅ CORS настроен правильно</p>
                  <p>✅ Можете использовать приложение</p>
                </div>
              ) : (
                <div className="bg-white bg-opacity-20 rounded-xl p-6 mt-4">
                  <h3 className="font-bold text-xl mb-2">📋 Что проверить:</h3>
                  <ul className="text-left space-y-2">
                    <li>• FRONTEND_URL установлен в Render Dashboard?</li>
                    <li>• Значение: {FRONTEND_URL}</li>
                    <li>• Backend передеплоен после добавления переменной?</li>
                    <li>• Backend не спит? (Render Free Tier)</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">ℹ️ Информация</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>Frontend:</strong> {FRONTEND_URL}</li>
              <li>• <strong>Backend:</strong> {BACKEND_URL}</li>
              <li>• <strong>Путь:</strong> /test</li>
              <li>• <strong>Режим:</strong> Production</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
