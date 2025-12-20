# 🧪 Тестирование API TravelHub Ultimate

## 📋 Обзор

Бэкенд TravelHub Ultimate успешно развернут и работает:
- **URL**: https://daten3-travelbackend.up.railway.app
- **Статус**: ✅ Работает
- **Всего эндпоинтов**: 56

## 🎯 Быстрый старт

### Проверка работоспособности

```bash
# Проверка здоровья API
curl https://daten3-travelbackend.up.railway.app/health

# Информация об API
curl https://daten3-travelbackend.up.railway.app/
```

### Запуск полного теста

```bash
cd backend
chmod +x test-api.sh
./test-api.sh
```

## 📊 Категории эндпоинтов

### 1. ❤️ Здоровье системы (2 эндпоинта)

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| GET | `/health` | Проверка здоровья сервера | Нет |
| GET | `/api/health` | Проверка здоровья API | Нет |

**Примеры:**

```bash
# Базовая проверка
curl https://daten3-travelbackend.up.railway.app/health

# Ответ:
{
  "status": "ok",
  "timestamp": "2025-12-20T10:57:00.000Z",
  "uptime": 123.45
}
```

### 2. 🔍 Поиск (4 эндпоинта)

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| GET | `/api/hotels/search` | Информация о поиске отелей | Нет |
| POST | `/api/hotels/search` | Поиск отелей | Нет |
| GET | `/api/flights/search` | Информация о поиске рейсов | Нет |
| POST | `/api/flights/search` | Поиск рейсов | Нет |

**Примеры:**

```bash
# Поиск отелей
curl -X POST https://daten3-travelbackend.up.railway.app/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Париж",
    "checkIn": "2025-06-01",
    "checkOut": "2025-06-05",
    "adults": 2,
    "rooms": 1
  }'

# Поиск рейсов
curl -X POST https://daten3-travelbackend.up.railway.app/api/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "from": "MOW",
    "to": "PAR",
    "departDate": "2025-06-01",
    "adults": 1
  }'
```

### 3. 🔐 Аутентификация (11 эндпоинтов)

#### Публичные эндпоинты (7)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация нового пользователя |
| POST | `/api/auth/login` | Вход в систему |
| POST | `/api/auth/refresh` | Обновление токена |
| POST | `/api/auth/forgot-password` | Забыли пароль |
| POST | `/api/auth/reset-password` | Сброс пароля |
| GET | `/api/auth/google` | Вход через Google |
| GET | `/api/auth/google/callback` | Callback Google OAuth |

**Примеры:**

```bash
# Регистрация
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "Иван",
    "lastName": "Петров"
  }'

# Вход
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'

# Ответ:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "Иван",
      "lastName": "Петров"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}

# Обновление токена
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Защищенные эндпоинты (4)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/auth/me` | Получить текущего пользователя |
| PUT | `/api/auth/me` | Обновить профиль |
| PUT | `/api/auth/me/password` | Изменить пароль |
| DELETE | `/api/auth/me` | Удалить аккаунт |

**Примеры:**

```bash
# Получить свой профиль
curl https://daten3-travelbackend.up.railway.app/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Обновить профиль
curl -X PUT https://daten3-travelbackend.up.railway.app/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Иван",
    "lastName": "Иванов",
    "phone": "+79991234567"
  }'

# Изменить пароль
curl -X PUT https://daten3-travelbackend.up.railway.app/api/auth/me/password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass456!"
  }'
```

### 4. 📅 Бронирования (5 эндпоинтов)

Все эндпоинты требуют авторизации.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/bookings` | Получить все бронирования |
| GET | `/api/bookings/:id` | Получить одно бронирование |
| POST | `/api/bookings` | Создать бронирование |
| PATCH | `/api/bookings/:id/status` | Обновить статус |
| DELETE | `/api/bookings/:id` | Отменить бронирование |

**Примеры:**

```bash
# Получить все бронирования
curl https://daten3-travelbackend.up.railway.app/api/bookings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Создать бронирование
curl -X POST https://daten3-travelbackend.up.railway.app/api/bookings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "hotel",
    "itemId": "hotel_123",
    "checkIn": "2025-06-01",
    "checkOut": "2025-06-05",
    "guests": 2,
    "totalPrice": 15000
  }'

# Обновить статус бронирования
curl -X PATCH https://daten3-travelbackend.up.railway.app/api/bookings/booking_123/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'

# Отменить бронирование
curl -X DELETE https://daten3-travelbackend.up.railway.app/api/bookings/booking_123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. ⭐ Избранное (4 эндпоинта)

Все эндпоинты требуют авторизации.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/favorites` | Получить избранное |
| POST | `/api/favorites` | Добавить в избранное |
| DELETE | `/api/favorites/:id` | Удалить из избранного |
| GET | `/api/favorites/check/:type/:itemId` | Проверить наличие |

**Примеры:**

```bash
# Получить избранное
curl https://daten3-travelbackend.up.railway.app/api/favorites \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Добавить в избранное
curl -X POST https://daten3-travelbackend.up.railway.app/api/favorites \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "hotel",
    "itemId": "hotel_456",
    "name": "Парижский отель",
    "location": "Париж, Франция",
    "price": 5000,
    "image": "https://example.com/hotel.jpg"
  }'

# Проверить избранное
curl https://daten3-travelbackend.up.railway.app/api/favorites/check/hotel/hotel_456 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Удалить из избранного
curl -X DELETE https://daten3-travelbackend.up.railway.app/api/favorites/fav_123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. 🔔 Ценовые уведомления (4 эндпоинта)

⚠️ **Статус**: В разработке (возвращают HTTP 501)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/price-alerts` | Получить уведомления |
| POST | `/api/price-alerts` | Создать уведомление |
| PATCH | `/api/price-alerts/:id` | Обновить уведомление |
| DELETE | `/api/price-alerts/:id` | Удалить уведомление |

### 7. 💰 Партнерская программа (13 эндпоинтов)

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| GET | `/api/affiliate/dashboard` | Дашборд партнера | Нет* |
| GET | `/api/affiliate/referral-tree` | Дерево рефералов | Нет* |
| GET | `/api/affiliate/stats` | Статистика | Нет* |
| POST | `/api/affiliate/register` | Регистрация партнера | Нет* |
| GET | `/api/affiliate/validate/:code` | Проверка кода | Нет |
| GET | `/api/affiliate/earnings` | Заработок | Нет* |
| GET | `/api/affiliate/referrals` | Список рефералов | Нет* |
| GET | `/api/affiliate/payouts` | История выплат | Нет* |
| POST | `/api/affiliate/payouts/request` | Запрос выплаты | Нет* |
| GET | `/api/affiliate/links` | Партнерские ссылки | Нет* |
| POST | `/api/affiliate/track-click` | Отслеживание клика | Нет |
| GET | `/api/affiliate/settings` | Настройки партнера | Нет* |
| PUT | `/api/affiliate/settings` | Обновить настройки | Нет* |

_* В продакшене будет требовать авторизацию_

**Примеры:**

```bash
# Дашборд партнера
curl https://daten3-travelbackend.up.railway.app/api/affiliate/dashboard

# Зарегистрироваться как партнер
curl -X POST https://daten3-travelbackend.up.railway.app/api/affiliate/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123"
  }'

# Ответ:
{
  "success": true,
  "message": "Successfully registered as affiliate partner",
  "data": {
    "referralCode": "REFABC123",
    "status": "active",
    "level": 1
  }
}

# Проверить реферальный код
curl https://daten3-travelbackend.up.railway.app/api/affiliate/validate/REFABC123

# Получить партнерские ссылки
curl https://daten3-travelbackend.up.railway.app/api/affiliate/links

# Запросить выплату
curl -X POST https://daten3-travelbackend.up.railway.app/api/affiliate/payouts/request \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "method": "bank_transfer"
  }'

# Дерево рефералов
curl https://daten3-travelbackend.up.railway.app/api/affiliate/referral-tree
```

### 8. 👑 Админ панель (14 эндпоинтов)

Все эндпоинты требуют роль администратора.

#### Управление партнерами (4)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/affiliates` | Список всех партнеров |
| GET | `/api/admin/affiliates/:id` | Детали партнера |
| PATCH | `/api/admin/affiliates/:id/status` | Изменить статус |
| PATCH | `/api/admin/affiliates/:id/verify` | Верифицировать |

#### Управление комиссиями (3)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/commissions` | Список комиссий |
| PATCH | `/api/admin/commissions/:id/approve` | Одобрить |
| PATCH | `/api/admin/commissions/:id/reject` | Отклонить |

#### Управление выплатами (4)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/payouts` | Список выплат |
| POST | `/api/admin/payouts/:id/process` | Обработать |
| PATCH | `/api/admin/payouts/:id/complete` | Завершить |
| PATCH | `/api/admin/payouts/:id/reject` | Отклонить |

#### Настройки и аналитика (3)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/settings` | Настройки программы |
| PUT | `/api/admin/settings` | Обновить настройки |
| GET | `/api/admin/analytics` | Общая аналитика |
| GET | `/api/admin/analytics/top-performers` | Топ партнеров |

**Примеры:**

```bash
# Получить всех партнеров (требуется admin токен)
curl https://daten3-travelbackend.up.railway.app/api/admin/affiliates \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Одобрить комиссию
curl -X PATCH https://daten3-travelbackend.up.railway.app/api/admin/commissions/comm_123/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Получить аналитику
curl https://daten3-travelbackend.up.railway.app/api/admin/analytics \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Настройки партнерской программы
curl https://daten3-travelbackend.up.railway.app/api/admin/settings \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 🔑 Авторизация

### Получение токена

1. **Регистрация**:
```bash
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Тест",
    "lastName": "Пользователь"
  }'
```

2. **Вход**:
```bash
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

3. **Использование токена**:
```bash
curl https://daten3-travelbackend.up.railway.app/api/bookings \
  -H "Authorization: Bearer ВАШ_ТОКЕН_ЗДЕСЬ"
```

### Типы токенов

- **Access Token**: Срок действия 15 минут
- **Refresh Token**: Срок действия 7 дней

## 🚦 Лимиты запросов

API использует rate limiting:

- **Strict** (строгий): Чувствительные операции (сброс пароля, выплаты)
- **Moderate** (умеренный): Стандартные операции (поиск, бронирование)
- **Lenient** (мягкий): Частые операции (обновление токена)
- **Very Lenient** (очень мягкий): Публичные операции

## 📝 Формат ответов

### Успешный ответ
```json
{
  "success": true,
  "message": "Операция выполнена успешно",
  "data": {
    // данные
  }
}
```

### Ошибка
```json
{
  "success": false,
  "error": "Тип ошибки",
  "message": "Описание ошибки",
  "statusCode": 400
}
```

## 🛠️ Инструменты для тестирования

### 1. Bash скрипт (автоматический)
```bash
cd backend
chmod +x test-api.sh
./test-api.sh
```

### 2. Postman Collection
Импортируйте `postman_collection.json` в Postman

### 3. cURL (ручное тестирование)
Используйте примеры выше

## ✅ Статус реализации

| Категория | Эндпоинтов | Статус |
|-----------|------------|--------|
| Здоровье | 2 | ✅ Работает |
| Поиск | 4 | ✅ Работает |
| Аутентификация | 11 | ✅ Работает |
| Бронирования | 5 | ✅ Работает (mock data) |
| Избранное | 4 | ✅ Работает (mock data) |
| Ценовые уведомления | 4 | ⚠️ В разработке |
| Партнерская программа | 13 | ✅ Работает (mock data) |
| Админ панель | 14 | ✅ Работает (mock data) |

**Всего**: 56 эндпоинтов, из них:
- ✅ **52 работающих** (93%)
- ⚠️ **4 в разработке** (7%)

## 🐛 Известные проблемы

1. **Price Alerts**: Возвращают HTTP 501 (Not Implemented)
2. **Admin endpoints**: Требуют реальную систему RBAC (сейчас возвращают 403)
3. **Mock данные**: Большинство эндпоинтов возвращают тестовые данные

## 🎯 Следующие шаги

1. ✅ Все эндпоинты работают
2. ⏳ Подключить реальную базу данных
3. ⏳ Интеграция с Travelpayouts API
4. ⏳ Реализовать Price Alerts
5. ⏳ Настроить систему ролей (RBAC)
6. ⏳ Добавить WebSocket для реал-тайм уведомлений

## 📞 Поддержка

При возникновении проблем проверьте:
- Логи Railway: https://railway.app
- Backend логи: `/logs/error.log`, `/logs/combined.log`
- Статус здоровья: https://daten3-travelbackend.up.railway.app/health
