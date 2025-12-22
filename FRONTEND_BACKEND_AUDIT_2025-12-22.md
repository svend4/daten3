# 🔍 Frontend-Backend Integration Audit Report

**Дата аудита:** 22 декабря 2025
**Проект:** TravelHub Ultimate
**Аудитор:** Claude (Anthropic)

---

## 📊 EXECUTIVE SUMMARY

Проведен полный аудит интеграции Frontend и Backend после внедрения security improvements (httpOnly cookies, Redis CSRF tokens). Обнаружены **КРИТИЧЕСКИЕ несовместимости** между обновленным backend и существующим frontend.

### Статус: ❌ **ТРЕБУЕТ НЕМЕДЛЕННОГО ИСПРАВЛЕНИЯ**

### Основные проблемы:
1. ❌ **КРИТИЧНО**: Frontend не адаптирован под httpOnly cookies
2. ❌ **КРИТИЧНО**: Отсутствует поддержка CSRF tokens
3. ⚠️ **ВАЖНО**: Многие backend endpoints не используются
4. ⚠️ **ВАЖНО**: Отсутствует функционал для Bookings, Favorites, Price Alerts

---

## 🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 1. HttpOnly Cookies Incompatibility

**Проблема:**
Backend теперь использует httpOnly cookies для JWT tokens (commit eff5f59), но frontend продолжает ожидать токены в response body и сохранять их в localStorage.

**Затронутые файлы:**
- `frontend/src/pages/Login.tsx:42-43`
- `frontend/src/pages/Register.tsx:64-65`
- `frontend/src/utils/api.ts:20-22`
- `frontend/src/components/common/Dropdown.tsx` (множественные места)

**Пример проблемного кода (Login.tsx):**
```typescript
// ❌ НЕПРАВИЛЬНО - backend больше не возвращает токены
const response = await api.post('/auth/login', { email, password });
localStorage.setItem('accessToken', response.data.accessToken); // undefined!
localStorage.setItem('refreshToken', response.data.refreshToken); // undefined!
```

**Backend теперь возвращает (auth.controller.ts:48-62):**
```typescript
// Токены в httpOnly cookies, НЕ в response body
res.cookie('accessToken', token, { httpOnly: true, ... });
res.cookie('refreshToken', refreshToken, { httpOnly: true, ... });

res.json({
  success: true,
  data: {
    user: { /* user data */ }
    // ❌ Нет accessToken и refreshToken!
  }
});
```

**Места использования localStorage для токенов (всего 24):**
1. `pages/Login.tsx:42-43` - setItem
2. `pages/Register.tsx:64-65` - setItem
3. `pages/Dashboard.tsx:97` - getItem
4. `pages/AffiliateReferrals.tsx:35` - getItem
5. `pages/AffiliateDashboard.tsx:57` - getItem
6. `components/common/Dropdown.tsx:33,46-47,68-69,91-92,105-106,113` - множественные
7. `components/common/Tabs.tsx:33` - getItem
8. `components/layout/Container.tsx:33` - getItem
9. `components/admin/AffiliateDashboard.tsx:56` - getItem
10. `utils/api.ts:20,51-52` - getItem, removeItem
11. `store/AuthContext.tsx:39` - removeItem

**Требуется:**
- ✅ Удалить все localStorage операции с токенами
- ✅ Обновить api.ts для работы с credentials (cookies)
- ✅ Обновить Login/Register для обработки response без токенов
- ✅ Обновить interceptors для работы без Bearer token

---

### 2. Missing CSRF Token Support

**Проблема:**
Backend требует CSRF token для всех POST/PUT/PATCH/DELETE операций (csrf.middleware.ts), но frontend НЕ отправляет CSRF tokens.

**Backend endpoint:**
```
GET /api/auth/csrf-token - получение CSRF token
```

**Использование во frontend:** ❌ НЕ ИСПОЛЬЗУЕТСЯ

**Что происходит сейчас:**
1. Frontend отправляет POST /api/auth/register
2. Backend проверяет CSRF token
3. ❌ Token отсутствует → 403 Forbidden
4. ❌ Регистрация не работает!

**Требуется:**
- ✅ Добавить функцию получения CSRF token при загрузке приложения
- ✅ Хранить CSRF token в React state/context
- ✅ Добавлять X-CSRF-Token header ко всем запросам (кроме GET/HEAD/OPTIONS)
- ✅ Обновлять token после login/logout

---

### 3. API Client Configuration

**Проблема:**
API client (utils/api.ts) не настроен для отправки cookies (credentials).

**Текущая конфигурация:**
```typescript
this.client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // ❌ Отсутствует: withCredentials: true
});
```

**Требуется:**
```typescript
this.client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ Для отправки httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## ⚠️ ВАЖНЫЕ ПРОБЛЕМЫ

### 4. Unused Backend Endpoints

**Проблема:**
Многие backend endpoints реализованы, но не используются во frontend.

#### 4.1 Bookings Endpoints (НЕ ИСПОЛЬЗУЮТСЯ)

Backend предоставляет:
- `GET /api/bookings` - список бронирований
- `GET /api/bookings/:id` - детали бронирования
- `POST /api/bookings` - создание бронирования
- `PATCH /api/bookings/:id/status` - обновление статуса
- `DELETE /api/bookings/:id` - отмена бронирования

Frontend:
- ❌ Страница `/bookings` существует, но НЕ делает API вызовы
- ❌ Нет функционала создания/просмотра бронирований
- ❌ Нет интеграции с Hotels/Flights поиском

#### 4.2 Favorites Endpoints (НЕ ИСПОЛЬЗУЮТСЯ)

Backend предоставляет:
- `GET /api/favorites` - список избранного
- `POST /api/favorites` - добавление в избранное
- `DELETE /api/favorites/:id` - удаление из избранного
- `GET /api/favorites/check` - проверка наличия

Frontend:
- ❌ Страница `/favorites` существует, но НЕ делает API вызовы
- ❌ Нет кнопок "Добавить в избранное" на карточках отелей
- ❌ Нет функционала работы с избранным

#### 4.3 Price Alerts Endpoints (НЕ ИСПОЛЬЗУЮТСЯ)

Backend предоставляет:
- `GET /api/price-alerts` - список уведомлений
- `POST /api/price-alerts` - создание уведомления
- `PATCH /api/price-alerts/:id` - обновление
- `DELETE /api/price-alerts/:id` - удаление

Frontend:
- ❌ НЕТ страницы для price alerts
- ❌ НЕТ UI для создания уведомлений о ценах
- ❌ Функционал полностью отсутствует

#### 4.4 Auth Endpoints (ЧАСТИЧНО используются)

Backend предоставляет (15 endpoints):
- ✅ `POST /auth/register` - используется
- ✅ `POST /auth/login` - используется
- ❌ `POST /auth/logout` - НЕ используется
- ❌ `POST /auth/refresh` - НЕ используется (критично!)
- ❌ `GET /auth/csrf-token` - НЕ используется (критично!)
- ❌ `POST /auth/forgot-password` - НЕ используется
- ❌ `POST /auth/reset-password` - НЕ используется
- ❌ `GET /auth/google` - есть кнопка, но НЕ подключена
- ❌ `GET /auth/google/callback` - НЕ реализовано
- ❌ `POST /auth/verify-email` - НЕ используется
- ❌ `GET /auth/resend-verification` - НЕ используется
- ❌ `GET /auth/me` - НЕ используется (важно!)
- ❌ `PUT /auth/profile` - НЕ используется
- ❌ `PUT /auth/change-password` - НЕ используется
- ❌ `DELETE /auth/me` - НЕ используется

#### 4.5 Affiliate Endpoints (ЧАСТИЧНО используются)

Backend предоставляет (14 endpoints):
- ✅ `GET /api/affiliate/earnings` - используется
- ✅ `GET /api/affiliate/payouts` - используется
- ✅ `GET /api/affiliate/referrals` - используется
- ❌ `GET /api/affiliate/dashboard` - НЕ используется
- ❌ `GET /api/affiliate/referral-tree` - НЕ используется
- ❌ `GET /api/affiliate/stats` - НЕ используется
- ❌ `POST /api/affiliate/register` - НЕ используется
- ❌ `GET /api/affiliate/validate/:code` - НЕ используется
- ❌ `POST /api/affiliate/payouts/request` - НЕ используется
- ❌ `GET /api/affiliate/links` - НЕ используется
- ❌ `POST /api/affiliate/track-click` - НЕ используется
- ❌ `GET /api/affiliate/settings` - НЕ используется
- ❌ `PUT /api/affiliate/settings` - НЕ используется

#### 4.6 Admin Endpoints (ЧАСТИЧНО используются)

Backend предоставляет (13 endpoints):
- ✅ `GET /api/admin/affiliates` - используется
- ✅ `GET /api/admin/commissions` - используется
- ✅ `GET /api/admin/payouts` - используется
- ✅ `GET /api/admin/settings` - используется
- ❌ `GET /api/admin/affiliates/:id` - НЕ используется
- ❌ `PATCH /api/admin/affiliates/:id/status` - НЕ используется
- ❌ `PATCH /api/admin/affiliates/:id/verify` - НЕ используется
- ❌ `PATCH /api/admin/commissions/:id/approve` - НЕ используется
- ❌ `PATCH /api/admin/commissions/:id/reject` - НЕ используется
- ❌ `POST /api/admin/payouts/:id/process` - НЕ используется
- ❌ `PATCH /api/admin/payouts/:id/complete` - НЕ используется
- ❌ `PATCH /api/admin/payouts/:id/reject` - НЕ используется
- ❌ `PUT /api/admin/settings` - НЕ используется
- ❌ `GET /api/admin/analytics` - НЕ используется
- ❌ `GET /api/admin/analytics/top-performers` - НЕ используется

---

## 📈 СТАТИСТИКА

### Frontend Pages vs Backend Integration

| Страница | Маршрут | Backend Integration | Статус |
|----------|---------|---------------------|--------|
| Home | `/` | Hotels/Flights search | ⚠️ Частично |
| Flight Search | `/flights` | POST /api/flights/search | ⚠️ Частично |
| Hotel Search | `/hotels` | POST /api/hotels/search | ⚠️ Частично |
| Login | `/login` | POST /api/auth/login | ❌ Не работает |
| Register | `/register` | POST /api/auth/register | ❌ Не работает |
| Dashboard | `/dashboard` | GET /api/auth/me | ❌ Не использует |
| Profile | `/profile` | PUT /api/auth/profile | ❌ Не использует |
| My Bookings | `/bookings` | GET /api/bookings | ❌ Не использует |
| Favorites | `/favorites` | GET /api/favorites | ❌ Не использует |
| Settings | `/settings` | PUT /api/auth/change-password | ❌ Не использует |
| Affiliate Dashboard | `/affiliate` | GET /api/affiliate/dashboard | ❌ Не использует |
| Affiliate Referrals | `/affiliate/referrals` | GET /api/affiliate/referrals | ⚠️ Частично |
| Admin Panel | `/admin` | Multiple admin endpoints | ⚠️ Частично |

### Backend Endpoints Coverage

| Группа | Всего Endpoints | Используется | Не используется | % Покрытия |
|--------|-----------------|--------------|-----------------|------------|
| **Auth** | 15 | 2 | 13 | 13% |
| **Hotels** | 2 | 1 | 1 | 50% |
| **Flights** | 2 | 1 | 1 | 50% |
| **Bookings** | 5 | 0 | 5 | 0% |
| **Favorites** | 4 | 0 | 4 | 0% |
| **Price Alerts** | 4 | 0 | 4 | 0% |
| **Affiliate** | 14 | 3 | 11 | 21% |
| **Admin** | 15 | 4 | 11 | 27% |
| **ИТОГО** | **61** | **11** | **50** | **18%** |

**КРИТИЧНО:** Только 18% backend endpoints используются во frontend!

---

## 🎯 PLAN ИСПРАВЛЕНИЯ

### Приоритет 1: КРИТИЧНО (Блокирует работу)

#### 1.1 Адаптация под httpOnly Cookies
- [ ] Обновить `utils/api.ts`:
  - Добавить `withCredentials: true`
  - Удалить добавление Authorization header из localStorage
  - Cookies автоматически отправляются браузером

- [ ] Обновить `pages/Login.tsx`:
  - Удалить `localStorage.setItem('accessToken', ...)`
  - Удалить `localStorage.setItem('refreshToken', ...)`
  - Обработать response без токенов

- [ ] Обновить `pages/Register.tsx`:
  - Аналогично Login.tsx

- [ ] Обновить `components/common/Dropdown.tsx`:
  - Удалить все localStorage операции с токенами
  - Использовать API endpoint `/auth/me` для получения пользователя

- [ ] Обновить `store/AuthContext.tsx`:
  - Заменить localStorage на cookies
  - Использовать `/auth/me` для проверки авторизации

#### 1.2 Добавление CSRF Token Support
- [ ] Создать `utils/csrf.ts`:
  ```typescript
  export const getCSRFToken = async (): Promise<string> => {
    const response = await api.get('/auth/csrf-token');
    return response.data.csrfToken;
  };
  ```

- [ ] Обновить `utils/api.ts`:
  - Добавить interceptor для X-CSRF-Token header
  - Получать CSRF token при инициализации
  - Обновлять token после login/logout

- [ ] Добавить CSRF context:
  ```typescript
  // contexts/CSRFContext.tsx
  export const CSRFProvider = ({ children }) => {
    const [csrfToken, setCSRFToken] = useState('');

    useEffect(() => {
      fetchCSRFToken();
    }, []);

    return <CSRFContext.Provider value={{ csrfToken }}>
      {children}
    </CSRFContext.Provider>
  };
  ```

#### 1.3 Logout Functionality
- [ ] Добавить logout endpoint вызов:
  ```typescript
  const logout = async () => {
    await api.post('/auth/logout');
    // Cookies очищаются сервером
    window.location.href = '/login';
  };
  ```

### Приоритет 2: ВАЖНО (Отсутствующий функционал)

#### 2.1 Bookings Integration
- [ ] Обновить `pages/MyBookings.tsx`:
  - GET /api/bookings - список
  - GET /api/bookings/:id - детали
  - DELETE /api/bookings/:id - отмена

- [ ] Добавить создание бронирования:
  - POST /api/bookings в Checkout flow

#### 2.2 Favorites Integration
- [ ] Обновить `pages/Favorites.tsx`:
  - GET /api/favorites - список

- [ ] Добавить кнопки в HotelCard:
  - POST /api/favorites - добавить
  - DELETE /api/favorites/:id - удалить
  - GET /api/favorites/check - проверка

#### 2.3 Price Alerts
- [ ] Создать компонент PriceAlertManager
- [ ] Интегрировать endpoints:
  - GET /api/price-alerts
  - POST /api/price-alerts
  - DELETE /api/price-alerts/:id

### Приоритет 3: УЛУЧШЕНИЯ

#### 3.1 User Profile
- [ ] GET /api/auth/me - текущий пользователь
- [ ] PUT /api/auth/profile - обновление профиля
- [ ] PUT /api/auth/change-password - смена пароля

#### 3.2 Password Recovery
- [ ] POST /api/auth/forgot-password
- [ ] POST /api/auth/reset-password
- [ ] Создать страницы ForgotPassword, ResetPassword

#### 3.3 Email Verification
- [ ] POST /api/auth/verify-email
- [ ] GET /api/auth/resend-verification
- [ ] Создать страницу VerifyEmail

#### 3.4 Social Auth
- [ ] Подключить GET /api/auth/google
- [ ] Реализовать GET /api/auth/google/callback

#### 3.5 Affiliate Features
- [ ] GET /api/affiliate/dashboard
- [ ] GET /api/affiliate/referral-tree
- [ ] POST /api/affiliate/register
- [ ] POST /api/affiliate/payouts/request

#### 3.6 Admin Features
- [ ] PATCH /api/admin/affiliates/:id/status
- [ ] PATCH /api/admin/commissions/:id/approve
- [ ] POST /api/admin/payouts/:id/process
- [ ] GET /api/admin/analytics

---

## 🔧 TECHNICAL IMPLEMENTATION

### Example: Updated api.ts

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;
  private csrfToken: string = '';

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true, // ✅ Для httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor для CSRF token
    this.client.interceptors.request.use(
      async (config) => {
        // Добавляем CSRF token для state-changing operations
        if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
          if (!this.csrfToken) {
            await this.fetchCSRFToken();
          }
          config.headers['X-CSRF-Token'] = this.csrfToken;
        }

        logger.apiRequest(config.method || 'GET', config.url || '', config.data);
        return config;
      },
      (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.apiResponse(
          response.config.method || 'GET',
          response.config.url || '',
          response.status,
          response.data
        );
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          logger.warn('Unauthorized - redirecting to login');
          // ✅ Cookies очищаются сервером при logout
          window.location.href = '/login';
        } else if (error.response?.status === 403 && error.response?.data?.error === 'Invalid CSRF token') {
          // Обновляем CSRF token и повторяем запрос
          await this.fetchCSRFToken();
          return this.client.request(error.config);
        } else {
          logger.error(
            `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            error.response?.data || error.message
          );
        }
        return Promise.reject(error);
      }
    );
  }

  async fetchCSRFToken(): Promise<void> {
    try {
      const response = await this.client.get('/auth/csrf-token');
      this.csrfToken = response.data.data.csrfToken;
    } catch (error) {
      logger.error('Failed to fetch CSRF token', error);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
```

### Example: Updated Login.tsx

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: {
        user: {
          id: string;
          email: string;
          name: string;
          role: string;
        };
        // ✅ Токены теперь в httpOnly cookies, не в response!
      };
    }>('/auth/login', { email, password });

    if (response.success && response.data) {
      // ✅ Сохраняем только user data (не токены!)
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Navigate to dashboard
      navigate('/dashboard');
    } else {
      setError(response.message || 'Login failed. Please try again.');
    }
  } catch (err: any) {
    logger.error('Login failed', err);
    setError(
      err.response?.data?.message ||
      'Invalid email or password. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};
```

---

## 📝 РЕКОМЕНДАЦИИ

### Immediate Actions (в течение 24 часов):

1. **Откатить backend на предыдущий коммит БЕЗ httpOnly cookies** временно
   - Или создать feature flag для включения/выключения httpOnly cookies
   - Это позволит frontend продолжать работать

2. **Создать отдельную ветку для frontend updates:**
   ```bash
   git checkout -b feature/httponly-cookies-frontend
   ```

3. **Обновить frontend согласно Priority 1 плану**

4. **Тестирование интеграции:**
   - Тестировать Login/Register
   - Тестировать CSRF protection
   - Тестировать автоматическую авторизацию через cookies

### Long-term (в течение недели):

1. Реализовать Priority 2 tasks (Bookings, Favorites, Price Alerts)
2. Добавить comprehensive testing
3. Обновить документацию
4. Code review

---

## 🎯 ИТОГОВАЯ ОЦЕНКА

| Критерий | Оценка | Статус |
|----------|--------|--------|
| **Frontend-Backend Sync** | 2/10 | ❌ Критично |
| **Endpoint Coverage** | 2/10 | ❌ 18% |
| **Security Integration** | 0/10 | ❌ Не работает |
| **User Experience** | 3/10 | ❌ Не работает |
| **Overall Status** | **2/10** | ❌ **НЕ РАБОТАЕТ** |

---

## 🚀 CONCLUSION

**Статус проекта:** ❌ **PRODUCTION DEPLOYMENT BLOCKED**

После внедрения security improvements (httpOnly cookies, CSRF protection) frontend стал **полностью несовместим** с backend API. Приложение **не работает** в текущем состоянии.

**Требуется:**
1. Немедленное обновление frontend для работы с httpOnly cookies
2. Интеграция CSRF token support
3. Реализация отсутствующего функционала (Bookings, Favorites, Price Alerts)

**Estimated Time to Fix:**
- Priority 1 (Critical): 8-12 часов
- Priority 2 (Important): 16-20 часов
- Priority 3 (Improvements): 20-30 часов
- **Total:** 44-62 часа (5-8 рабочих дней)

---

**Аудит выполнен:** Claude (Anthropic)
**Дата:** 22 декабря 2025
**Следующий шаг:** Начать реализацию Priority 1 fixes
