# 🔗 TravelHub Ultimate - Frontend Integration Guide

## 📖 Обзор

Этот документ описывает архитектуру frontend приложения, интеграцию с backend API, и предоставляет руководство для разработчиков.

---

## 🏗️ Архитектура

### Технологический стек

- **React 18+** - UI библиотека
- **TypeScript** - Типизация
- **React Router v6** - Маршрутизация
- **TanStack Query (React Query)** - Управление серверным состоянием
- **Tailwind CSS** - Стилизация
- **Axios** - HTTP клиент
- **Lucide React** - Иконки

### Структура проекта

```
frontend/src/
├── components/          # Переиспользуемые компоненты
│   ├── common/         # Базовые компоненты (Button, Card, Input)
│   ├── layout/         # Layout компоненты (Header, Footer, Container)
│   └── admin/          # Admin-специфичные компоненты
├── pages/              # Страницы приложения
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Profile.tsx
│   ├── MyBookings.tsx
│   ├── Favorites.tsx
│   ├── PriceAlerts.tsx
│   ├── Settings.tsx
│   └── ...
├── store/              # Глобальное состояние
│   └── AuthContext.tsx # Контекст аутентификации
├── utils/              # Утилиты
│   ├── api.ts          # API клиент
│   └── logger.ts       # Логирование
└── App.tsx             # Главный компонент

```

---

## 🔐 Система аутентификации

### HttpOnly Cookies + CSRF Protection

Приложение использует современную безопасную аутентификацию:

#### 1. HttpOnly Cookies для JWT токенов

```typescript
// Backend устанавливает токены в httpOnly cookies
res.cookie('accessToken', token, {
  httpOnly: true,        // Недоступно для JavaScript
  secure: true,          // Только HTTPS
  sameSite: 'strict',    // CSRF защита
  maxAge: 15 * 60 * 1000 // 15 минут
});
```

#### 2. Автоматическая обработка CSRF токенов

```typescript
// utils/api.ts
class ApiClient {
  async initialize() {
    // Получаем CSRF token при старте приложения
    const response = await this.client.get('/auth/csrf-token');
    this.csrfToken = response.data.data.csrfToken;
  }

  // Автоматически добавляем CSRF token в headers
  interceptors.request.use((config) => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
      config.headers['X-CSRF-Token'] = this.csrfToken;
    }
  });
}
```

#### 3. AuthContext для управления пользователем

```typescript
// store/AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Проверка аутентификации через /auth/me
  const checkAuth = async () => {
    const response = await api.get('/auth/me');
    setUser(response.data.user);
  };

  // Login без сохранения токенов
  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    setUser(response.data.user);
    await api.refreshCSRFToken();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Использование в компонентах

```typescript
import { useAuth } from '../store/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <div>Welcome, {user.firstName}!</div>;
};
```

---

## 🌐 API Интеграция

### API Client (utils/api.ts)

Централизованный API клиент с автоматической обработкой:

```typescript
import { api } from '../utils/api';

// GET запрос
const response = await api.get<{ success: boolean; data: User[] }>('/users');

// POST запрос
const response = await api.post<{ success: boolean; data: User }>('/users', {
  firstName: 'John',
  lastName: 'Doe'
});

// PUT запрос
const response = await api.put<{ success: boolean }>('/users/123', userData);

// DELETE запрос
const response = await api.delete<{ success: boolean }>('/users/123');
```

### Типизация ответов

Все API вызовы типизированы:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Использование
const response = await api.get<ApiResponse<User[]>>('/users');
if (response.success) {
  const users = response.data; // Type: User[]
}
```

---

## 📄 Интегрированные страницы

### 1. Dashboard (`/dashboard`)

**Endpoints:**
- GET `/bookings` - статистика бронирований
- GET `/favorites` - количество избранного
- GET `/price-alerts` - количество уведомлений

**Функционал:**
- Персонализированное приветствие
- Статистические карточки с переходами
- Последние 3 бронирования
- Quick actions для быстрого доступа

### 2. My Bookings (`/bookings`)

**Endpoints:**
- GET `/bookings` - список бронирований
- DELETE `/bookings/:id` - отмена бронирования

**Функционал:**
- Просмотр всех бронирований
- Фильтрация по типу (Hotel/Flight)
- Отмена бронирований (только CONFIRMED)
- Status indicators

### 3. Favorites (`/favorites`)

**Endpoints:**
- GET `/favorites` - список избранного
- POST `/favorites` - добавление
- DELETE `/favorites/:id` - удаление
- GET `/favorites/check/:type/:itemId` - проверка статуса

**Функционал:**
- Grid layout с изображениями
- Добавление/удаление
- Фильтрация по типу
- Heart button на HotelDetails

### 4. Price Alerts (`/price-alerts`)

**Endpoints:**
- GET `/price-alerts` - список уведомлений
- POST `/price-alerts` - создание
- PATCH `/price-alerts/:id` - обновление
- DELETE `/price-alerts/:id` - удаление

**Функционал:**
- Создание alerts для отелей и рейсов
- Пауза/активация
- Удаление
- Фильтрация по типу
- Status indicators (ACTIVE, TRIGGERED, EXPIRED)

### 5. Profile (`/profile`)

**Endpoints:**
- GET `/auth/me` - данные пользователя
- PUT `/auth/me` - обновление профиля
- POST `/auth/send-verification-email` - отправка verification email

**Функционал:**
- Просмотр профиля
- Редактирование firstName, lastName, phone
- Email read-only
- **Email verification status badge (Verified/Not verified)**
- **Email verification card для неверифицированных пользователей**
- **Send verification email button**
- Success/error notifications

### 6. Settings (`/settings`)

**Endpoints:**
- PUT `/auth/me/password` - смена пароля

**Функционал:**
- Смена пароля с валидацией
- Security секция (placeholders)
- Danger zone (placeholder)

### 7. Checkout (`/checkout`)

**Endpoints:**
- POST `/bookings` - создание бронирования

**Функционал:**
- Создание новых бронирований
- Автоматический расчет стоимости
- Валидация дат
- Payment form

### 8. Hotel Details (`/hotel/:id`)

**Endpoints:**
- POST `/favorites` - добавление в избранное
- DELETE `/favorites/:id` - удаление
- GET `/favorites/check/hotel/:id` - проверка статуса

**Функционал:**
- Heart button для favorites
- Visual indicator (red when favorited)
- Room selection
- Booking navigation

### 9. Forgot Password (`/forgot-password`)

**Endpoints:**
- POST `/auth/forgot-password` - отправка ссылки восстановления

**Функционал:**
- Запрос восстановления пароля по email
- Email validation
- Success/error messaging
- Link на страницу login
- Link на страницу registration

### 10. Reset Password (`/reset-password`)

**Endpoints:**
- POST `/auth/reset-password` - сброс пароля по токену

**Функционал:**
- Token extraction из URL query parameters
- Password strength validation (8+ chars, uppercase, lowercase, number)
- Real-time password requirements indicator
- Password visibility toggle
- Passwords match validation
- Expired/invalid token handling
- Auto-redirect на login после успеха

### 11. Email Verification (`/verify-email`)

**Endpoints:**
- GET `/auth/verify-email` - верификация email по токену

**Функционал:**
- Автоматическая верификация при загрузке страницы
- Token extraction из URL query parameters
- 4 verification states: verifying, success, error, invalid
- Auto-redirect на dashboard/login после успешной верификации
- Helpful error messages с troubleshooting tips
- Retry options при ошибках

### 12. Booking Details (`/bookings/:id`)

**Endpoints:**
- GET `/bookings/:id` - детальная информация о бронировании
- DELETE `/bookings/:id` - отмена бронирования (через действие на странице)

**Функционал:**
- Comprehensive booking information display
- Hotel/Flight details с изображениями
- Check-in/Check-out dates с расчетом количества ночей
- Guest и room information
- Payment information и breakdown
- Status indicators (CONFIRMED, PENDING, CANCELLED, COMPLETED)
- Cancel booking button (только для CONFIRMED)
- Booking metadata (ID, created, updated dates)
- Action buttons placeholders (Download invoice, Email confirmation)
- Help card с ссылкой на support
- Back navigation to My Bookings

---

## 🔒 Паттерны безопасности

### Authentication Guards

Все защищенные страницы используют authentication guard:

```typescript
const ProtectedPage = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Authentication guard
  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  // Protected content
  return <div>...</div>;
};
```

### Input Validation

```typescript
// Client-side validation
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Validate
  if (password.length < 8) {
    setError('Password must be at least 8 characters');
    return;
  }

  // Submit
  await api.post('/auth/register', { email, password });
};
```

### Error Handling

```typescript
try {
  const response = await api.post('/endpoint', data);
  if (response.success) {
    // Success
  } else {
    setError(response.message);
  }
} catch (err: any) {
  logger.error('Operation failed', err);
  setError(err.response?.data?.message || 'An error occurred');
}
```

---

## 🎨 UX Паттерны

### Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await api.post('/endpoint', data);
  } finally {
    setLoading(false);
  }
};

return <Button loading={loading}>Submit</Button>;
```

### Success/Error Messages

```typescript
const [success, setSuccess] = useState('');
const [error, setError] = useState('');

// Show success
setSuccess('Operation completed');
setTimeout(() => setSuccess(''), 3000);

// Render
{success && (
  <Card className="bg-green-50">
    <CheckCircle /> {success}
  </Card>
)}

{error && (
  <Card className="bg-red-50">
    <AlertCircle /> {error}
  </Card>
)}
```

### Optimistic UI Updates

```typescript
// Remove item optimistically
setItems(prev => prev.filter(item => item.id !== itemId));

try {
  await api.delete(`/items/${itemId}`);
} catch (error) {
  // Rollback on error
  fetchItems();
}
```

---

## 📊 Управление состоянием

### Локальное состояние (useState)

Для компонент-специфичных данных:

```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
```

### Глобальное состояние (Context)

Для данных, используемых в нескольких компонентах:

```typescript
// AuthContext для пользователя
const { user, isAuthenticated } = useAuth();
```

### Серверное состояние (React Query) - Опционально

Для кеширования API данных:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['bookings'],
  queryFn: () => api.get('/bookings')
});
```

---

## 🧪 Тестирование

### Локальная разработка

```bash
# Start development server
npm run dev

# Backend должен работать на http://localhost:3000
# Frontend на http://localhost:5173
```

### Environment Variables

```env
# .env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Тестирование аутентификации

1. Зарегистрируйте пользователя на `/register`
2. Войдите на `/login`
3. Проверьте cookies в DevTools (Application → Cookies)
4. Должны быть `accessToken` и `refreshToken` (httpOnly)

### Тестирование CSRF

1. Откройте DevTools → Network
2. Выполните POST/PUT/DELETE запрос
3. Проверьте headers: должен быть `X-CSRF-Token`

---

## 🐛 Отладка

### API Errors

```typescript
// utils/logger.ts используется для логирования
import { logger } from '../utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('API error', error);
logger.warn('Deprecated feature used');
```

### Network Debugging

1. Откройте DevTools → Network
2. Фильтр: XHR
3. Проверьте:
   - Request headers (withCredentials, X-CSRF-Token)
   - Response status codes
   - Response data

### Common Issues

#### 1. "CSRF token missing"
```typescript
// Убедитесь что api.initialize() вызван в App.tsx
useEffect(() => {
  api.initialize();
}, []);
```

#### 2. "Unauthorized" на защищенных endpoints
```typescript
// Проверьте что cookies отправляются
// В api.ts должно быть:
axios.create({ withCredentials: true });
```

#### 3. Redirect loop на login
```typescript
// Проверьте AuthContext.checkAuth()
// Должен корректно обрабатывать 401 ошибки
```

---

## 📦 Деплой

### Production Build

```bash
npm run build
```

### Environment Variables для Production

```env
VITE_API_BASE_URL=https://api.travelhub.com/api
```

### Checklist перед деплоем

- [ ] Все environment variables настроены
- [ ] CORS настроен на backend для frontend domain
- [ ] HTTPS включен (обязательно для httpOnly cookies)
- [ ] Backend доступен с frontend domain
- [ ] CSRF tokens работают cross-domain

---

## 🚀 Следующие шаги

### Неинтегрированные функции (приоритет 4)

1. **Extended Booking Features**
   - PATCH `/bookings/:id` - модификация бронирований
   - Booking history filtering
   - PDF invoice generation
   - Email confirmation sending

2. **Reviews System**
   - Требует создания endpoints на backend
   - Создание отзывов на отели
   - Рейтинги и модерация

3. **Affiliate Program**
   - Множество endpoints уже есть (14 endpoints)
   - Требует создание UI
   - Реферальная система
   - Комиссии и Payouts

4. **Admin Panel**
   - Множество endpoints уже есть (15 endpoints)
   - Требует создание UI
   - Управление пользователями
   - Аналитика
   - Модерация контента

5. **Social Authentication**
   - Google OAuth
   - Facebook OAuth
   - Автоматическая регистрация

---

## 📚 Дополнительные ресурсы

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)
- [Axios](https://axios-http.com/docs/intro)

---

## 🤝 Contributing

При добавлении новых интеграций:

1. Создайте TypeScript интерфейсы для API responses
2. Добавьте proper error handling
3. Используйте authentication guards
4. Добавьте loading states
5. Следуйте существующим паттернам UX
6. Обновите эту документацию

---

**Документация обновлена:** 22 декабря 2025
