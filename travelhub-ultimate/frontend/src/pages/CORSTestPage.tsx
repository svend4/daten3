import React, { useState } from 'react';

const CORSTestPage: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = 'https://daten3-1.onrender.com';

  const testCORS = async () => {
    setLoading(true);
    setResult('Отправка запроса...');

    try {
      console.log('🚀 Отправка fetch запроса к:', `${BACKEND_URL}/health/cors-test`);

      const response = await fetch(`${BACKEND_URL}/health/cors-test`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Получен ответ:', response);
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);

      const data = await response.json();
      console.log('Data:', data);

      setResult(JSON.stringify({
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: data,
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        }
      }, null, 2));

    } catch (error) {
      console.error('❌ Ошибка:', error);
      setResult(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof TypeError ? 'TypeError (обычно CORS блокировка)' : 'Other',
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const testHealthEndpoint = async () => {
    setLoading(true);
    setResult('Отправка запроса к /health...');

    try {
      console.log('🚀 Отправка fetch запроса к:', `${BACKEND_URL}/health`);

      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('✅ Получен ответ:', response);

      const data = await response.json();
      console.log('Data:', data);

      setResult(JSON.stringify({
        success: true,
        status: response.status,
        data: data,
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        }
      }, null, 2));

    } catch (error) {
      console.error('❌ Ошибка:', error);
      setResult(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🧪 CORS Test Page</h1>
      <p>Тестирование CORS между frontend и backend</p>

      <div style={{ marginTop: '30px' }}>
        <h2>Информация:</h2>
        <ul>
          <li><strong>Frontend URL:</strong> {window.location.origin}</li>
          <li><strong>Backend URL:</strong> {BACKEND_URL}</li>
          <li><strong>Test Endpoint:</strong> {BACKEND_URL}/health/cors-test</li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
        <button
          onClick={testCORS}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Загрузка...' : '🚀 Тест CORS /health/cors-test'}
        </button>

        <button
          onClick={testHealthEndpoint}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Загрузка...' : '🏥 Тест /health'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '30px' }}>
          <h2>📊 Результат:</h2>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '20px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '14px',
              border: '1px solid #ddd',
            }}
          >
            {result}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '40px', backgroundColor: '#fff3cd', padding: '20px', borderRadius: '4px' }}>
        <h3>💡 Инструкции:</h3>
        <ol>
          <li>Откройте Developer Tools (F12)</li>
          <li>Перейдите на вкладку Console</li>
          <li>Нажмите кнопку "Тест CORS"</li>
          <li>Проверьте логи в консоли и результат ниже</li>
          <li>Если видите ошибку CORS - проверьте логи backend на Render</li>
        </ol>

        <h3 style={{ marginTop: '20px' }}>🔍 Что проверяется:</h3>
        <ul>
          <li>✅ Доходит ли запрос до backend</li>
          <li>✅ Возвращает ли backend CORS заголовки</li>
          <li>✅ Пропускает ли браузер ответ</li>
          <li>✅ Работает ли credentials (cookies)</li>
        </ul>
      </div>
    </div>
  );
};

export default CORSTestPage;
