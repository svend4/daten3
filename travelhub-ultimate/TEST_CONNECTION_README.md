# 🔗 Frontend-Backend Connection Testing Guide

Этот документ описывает инструменты для тестирования подключения между frontend и backend TravelHub.

## 📋 Созданные тестовые инструменты

### 1. Backend Connection Test (Node.js)
**Файл:** `test-backend-connection.js`

Скрипт для тестирования backend API через Node.js.

#### Использование:

```bash
# Тест production backend
node test-backend-connection.js --prod

# Тест local backend
node test-backend-connection.js --local

# Тест обоих
node test-backend-connection.js
```

#### Что тестируется:
- ✅ Health Check endpoint (`/api/health`)
- ✅ Root endpoint (`/`)
- ✅ CSRF Token endpoint (`/api/auth/csrf-token`)
- ✅ API Documentation (`/api-docs.json`)
- ✅ CORS configuration

---

### 2. Frontend API Client Test (Vitest)
**Файл:** `frontend/src/utils/__tests__/api.test.ts`

Unit тесты для API клиента frontend.

#### Использование:

```bash
# Перейти в директорию frontend
cd frontend

# Запустить тесты
npm test

# Запустить с покрытием
npm run test:coverage

# Запустить в UI режиме
npm run test:ui
```

#### Что тестируется:
- ✅ Создание axios instance
- ✅ Наличие interceptors
- ✅ HTTP методы (GET, POST, PUT, DELETE)
- ✅ Методы инициализации
- ✅ Управление CSRF токеном

---

### 3. Visual E2E Test (HTML)
**Файл:** `test-frontend-backend-connection.html`

Интерактивный визуальный тест в браузере.

#### Использование:

1. **Вариант 1: Открыть напрямую**
   ```bash
   # На Linux
   xdg-open test-frontend-backend-connection.html

   # На macOS
   open test-frontend-backend-connection.html

   # На Windows
   start test-frontend-backend-connection.html
   ```

2. **Вариант 2: Через локальный сервер**
   ```bash
   # Python 3
   python -m http.server 8080

   # Затем открыть в браузере
   # http://localhost:8080/test-frontend-backend-connection.html
   ```

#### Возможности:
- 🎯 Тест local backend (http://localhost:3000/api)
- 🌐 Тест production backend (https://daten3-1.onrender.com/api)
- 🔧 Тест кастомного URL
- 📊 Визуальное отображение результатов
- 📈 Статистика успешности тестов

---

## 🚀 Быстрый старт

### Полное тестирование в 3 шага:

1. **Запустить backend** (если тестируете локально):
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Запустить frontend** (опционально):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Запустить тесты**:
   ```bash
   # Из корневой директории
   node test-backend-connection.js --local

   # Или открыть HTML тест
   open test-frontend-backend-connection.html
   ```

---

## 🔍 Интерпретация результатов

### ✅ Успешный тест
Все 5 тестов должны пройти:
```
✅ Health Check - Status: 200
✅ Root Endpoint - TravelHub Ultimate API v1.0.0
✅ CSRF Token - Token received
✅ API Documentation - Swagger 3.0
✅ CORS - Configured correctly
```

### ❌ Возможные проблемы

#### 1. Connection Refused
```
❌ Health check FAILED: connect ECONNREFUSED
```
**Решение:** Backend не запущен. Запустите `npm run dev` в директории backend.

#### 2. DNS Error
```
❌ Health check FAILED: getaddrinfo EAI_AGAIN
```
**Решение:** Проблема с интернет подключением или DNS. Проверьте сеть.

#### 3. CORS Error (в браузере)
```
Access to fetch at '...' has been blocked by CORS policy
```
**Решение:** Backend должен разрешать CORS для вашего домена. Проверьте настройки CORS в `backend/src/middleware/cors.middleware.ts`.

#### 4. 404 Not Found
```
❌ CSRF token FAILED: Status 404
```
**Решение:** Эндпоинт не существует. Проверьте версию backend и routes.

---

## 📊 Структура тестов

```
travelhub-ultimate/
├── test-backend-connection.js          # Node.js тест backend
├── test-frontend-backend-connection.html  # HTML визуальный тест
├── frontend/
│   └── src/
│       └── utils/
│           ├── api.ts                  # API клиент
│           └── __tests__/
│               └── api.test.ts         # Unit тесты API клиента
└── backend/
    └── src/
        ├── index.ts                    # Backend server
        └── routes/
            ├── auth.routes.ts          # Auth endpoints (CSRF)
            └── health.routes.ts        # Health check
```

---

## 🛠️ Настройка окружения

### Environment Variables

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
```

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://daten3-1.onrender.com/api
VITE_API_TIMEOUT=30000
```

**Backend (.env):**
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

## 🔐 Безопасность

### CSRF Protection
API клиент автоматически:
1. Получает CSRF токен при инициализации
2. Добавляет токен в заголовок `X-CSRF-Token` для всех POST/PUT/DELETE запросов
3. Обновляет токен при 403 ошибках

### Cookies
- Используются httpOnly cookies для сессий
- Включен `withCredentials: true` в axios

---

## 📝 Примеры использования API

### Получение CSRF токена
```javascript
// Автоматически при инициализации
await api.initialize();
```

### GET запрос
```javascript
const hotels = await api.get('/hotels/search', {
  params: { city: 'Moscow', checkIn: '2024-01-01' }
});
```

### POST запрос с CSRF
```javascript
const booking = await api.post('/bookings', {
  hotelId: 123,
  roomType: 'deluxe',
  // ...
});
```

---

## 🐛 Отладка

### Включить логирование
В `frontend/src/utils/logger.ts` установите:
```typescript
const LOG_LEVEL = 'debug'; // вместо 'info'
```

### Просмотр запросов в DevTools
1. Откройте браузер DevTools (F12)
2. Вкладка Network
3. Фильтр: XHR/Fetch
4. Проверьте:
   - Request Headers (есть ли X-CSRF-Token)
   - Response Status
   - Cookie (установлены ли cookies)

---

## ✅ Чеклист перед деплоем

- [ ] Все тесты проходят локально
- [ ] CORS настроен для production домена
- [ ] Environment variables установлены
- [ ] CSRF токен работает
- [ ] Cookies передаются корректно
- [ ] Health check отвечает быстро (< 1s)
- [ ] API documentation доступна

---

## 📞 Поддержка

При проблемах с подключением:
1. Проверьте логи backend: `backend/logs/`
2. Проверьте консоль браузера (F12)
3. Запустите тесты для диагностики
4. Проверьте network connectivity

---

**Создано:** 2025-12-23
**Версия:** 1.0.0
**Проект:** TravelHub Ultimate
