# 📋 Полный список всех 56 эндпоинтов TravelHub Ultimate API

**Backend URL**: https://daten3-travelbackend.up.railway.app

## Сводка

Корневой эндпоинт `/` показывает только **категории**, а не все эндпоинты.
Каждая категория содержит множество эндпоинтов внутри себя.

```json
{
  "endpoints": {
    "health": "/api/health",           // 2 эндпоинта внутри
    "auth": "/api/auth",               // 11 эндпоинтов внутри
    "hotels": "/api/hotels/search",    // 2 эндпоинта
    "flights": "/api/flights/search",  // 2 эндпоинта
    "affiliate": "/api/affiliate",     // 13 эндпоинтов внутри
    "bookings": "/api/bookings",       // 5 эндпоинтов внутри
    "favorites": "/api/favorites",     // 4 эндпоинта внутри
    "priceAlerts": "/api/price-alerts",// 4 эндпоинта внутри
    "admin": "/api/admin"              // 14 эндпоинтов внутри
  }
}
```

---

## ✅ Все 56 эндпоинтов (подробно)

### 1. 🏥 Здоровье системы (2)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 1 | GET | `/health` | Проверка здоровья сервера | ❌ |
| 2 | GET | `/api/health` | Проверка здоровья API | ❌ |

---

### 2. 📖 Информация (1)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 3 | GET | `/` | Информация об API и категориях | ❌ |

---

### 3. 🔍 Поиск отелей (2)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 4 | GET | `/api/hotels/search` | Информация о поиске | ❌ |
| 5 | POST | `/api/hotels/search` | Поиск отелей | ❌ |

**Пример запроса:**
```bash
curl -X POST https://daten3-travelbackend.up.railway.app/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{"destination":"Париж","checkIn":"2025-06-01","checkOut":"2025-06-05","adults":2,"rooms":1}'
```

---

### 4. ✈️ Поиск рейсов (2)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 6 | GET | `/api/flights/search` | Информация о поиске | ❌ |
| 7 | POST | `/api/flights/search` | Поиск рейсов | ❌ |

**Пример запроса:**
```bash
curl -X POST https://daten3-travelbackend.up.railway.app/api/flights/search \
  -H "Content-Type: application/json" \
  -d '{"from":"MOW","to":"PAR","departDate":"2025-06-01","adults":1}'
```

---

### 5. 🔐 Аутентификация - Публичные (7)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 8 | POST | `/api/auth/register` | Регистрация | ❌ |
| 9 | POST | `/api/auth/login` | Вход | ❌ |
| 10 | POST | `/api/auth/refresh` | Обновление токена | ❌ |
| 11 | POST | `/api/auth/forgot-password` | Забыли пароль | ❌ |
| 12 | POST | `/api/auth/reset-password` | Сброс пароля | ❌ |
| 13 | GET | `/api/auth/google` | OAuth Google | ❌ |
| 14 | GET | `/api/auth/google/callback` | Callback Google | ❌ |

**Примеры:**

```bash
# Регистрация
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!","firstName":"Иван","lastName":"Петров"}'

# Вход
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}'
```

---

### 6. 🔐 Аутентификация - Защищенные (4)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 15 | GET | `/api/auth/me` | Получить профиль | ✅ |
| 16 | PUT | `/api/auth/me` | Обновить профиль | ✅ |
| 17 | PUT | `/api/auth/me/password` | Изменить пароль | ✅ |
| 18 | DELETE | `/api/auth/me` | Удалить аккаунт | ✅ |

**Примеры:**

```bash
# Получить профиль
curl https://daten3-travelbackend.up.railway.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Обновить профиль
curl -X PUT https://daten3-travelbackend.up.railway.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Новое","lastName":"Имя","phone":"+79991234567"}'
```

---

### 7. 📅 Бронирования (5)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 19 | GET | `/api/bookings` | Все бронирования | ✅ |
| 20 | GET | `/api/bookings/:id` | Одно бронирование | ✅ |
| 21 | POST | `/api/bookings` | Создать | ✅ |
| 22 | PATCH | `/api/bookings/:id/status` | Обновить статус | ✅ |
| 23 | DELETE | `/api/bookings/:id` | Отменить | ✅ |

**Примеры:**

```bash
# Получить все
curl https://daten3-travelbackend.up.railway.app/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Создать
curl -X POST https://daten3-travelbackend.up.railway.app/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"hotel","itemId":"hotel_123","checkIn":"2025-06-01","checkOut":"2025-06-05","totalPrice":15000}'

# Получить одно
curl https://daten3-travelbackend.up.railway.app/api/bookings/booking_123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Обновить статус
curl -X PATCH https://daten3-travelbackend.up.railway.app/api/bookings/booking_123/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'

# Отменить
curl -X DELETE https://daten3-travelbackend.up.railway.app/api/bookings/booking_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8. ⭐ Избранное (4)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 24 | GET | `/api/favorites` | Все избранное | ✅ |
| 25 | POST | `/api/favorites` | Добавить | ✅ |
| 26 | DELETE | `/api/favorites/:id` | Удалить | ✅ |
| 27 | GET | `/api/favorites/check/:type/:itemId` | Проверить | ✅ |

**Примеры:**

```bash
# Получить все
curl https://daten3-travelbackend.up.railway.app/api/favorites \
  -H "Authorization: Bearer YOUR_TOKEN"

# Добавить
curl -X POST https://daten3-travelbackend.up.railway.app/api/favorites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"hotel","itemId":"hotel_456","name":"Отель Париж","location":"Париж","price":5000}'

# Проверить
curl https://daten3-travelbackend.up.railway.app/api/favorites/check/hotel/hotel_456 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Удалить
curl -X DELETE https://daten3-travelbackend.up.railway.app/api/favorites/fav_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 9. 🔔 Ценовые уведомления (4) ⚠️ В разработке

| № | Метод | Эндпоинт | Описание | Auth | Статус |
|---|-------|----------|----------|------|--------|
| 28 | GET | `/api/price-alerts` | Все уведомления | ✅ | 501 |
| 29 | POST | `/api/price-alerts` | Создать | ✅ | 501 |
| 30 | PATCH | `/api/price-alerts/:id` | Обновить | ✅ | 501 |
| 31 | DELETE | `/api/price-alerts/:id` | Удалить | ✅ | 501 |

⚠️ Все эндпоинты возвращают HTTP 501 (Not Implemented)

---

### 10. 💰 Партнерская программа (13)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 32 | GET | `/api/affiliate/dashboard` | Дашборд | ❌* |
| 33 | GET | `/api/affiliate/referral-tree` | Дерево рефералов | ❌* |
| 34 | GET | `/api/affiliate/stats` | Статистика | ❌* |
| 35 | POST | `/api/affiliate/register` | Регистрация | ❌* |
| 36 | GET | `/api/affiliate/validate/:code` | Проверка кода | ❌ |
| 37 | GET | `/api/affiliate/earnings` | Заработок | ❌* |
| 38 | GET | `/api/affiliate/referrals` | Список рефералов | ❌* |
| 39 | GET | `/api/affiliate/payouts` | История выплат | ❌* |
| 40 | POST | `/api/affiliate/payouts/request` | Запрос выплаты | ❌* |
| 41 | GET | `/api/affiliate/links` | Партнерские ссылки | ❌* |
| 42 | POST | `/api/affiliate/track-click` | Отслеживание клика | ❌ |
| 43 | GET | `/api/affiliate/settings` | Настройки | ❌* |
| 44 | PUT | `/api/affiliate/settings` | Обновить настройки | ❌* |

_* Сейчас работает без auth, но в продакшене будет требовать авторизацию_

**Примеры:**

```bash
# Дашборд
curl https://daten3-travelbackend.up.railway.app/api/affiliate/dashboard

# Зарегистрироваться
curl -X POST https://daten3-travelbackend.up.railway.app/api/affiliate/register \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123"}'

# Дерево рефералов
curl https://daten3-travelbackend.up.railway.app/api/affiliate/referral-tree

# Статистика
curl https://daten3-travelbackend.up.railway.app/api/affiliate/stats

# Проверить код
curl https://daten3-travelbackend.up.railway.app/api/affiliate/validate/REF123456

# Заработок
curl https://daten3-travelbackend.up.railway.app/api/affiliate/earnings

# Рефералы
curl https://daten3-travelbackend.up.railway.app/api/affiliate/referrals

# История выплат
curl https://daten3-travelbackend.up.railway.app/api/affiliate/payouts

# Запросить выплату
curl -X POST https://daten3-travelbackend.up.railway.app/api/affiliate/payouts/request \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"method":"bank_transfer"}'

# Партнерские ссылки
curl https://daten3-travelbackend.up.railway.app/api/affiliate/links

# Отследить клик
curl -X POST https://daten3-travelbackend.up.railway.app/api/affiliate/track-click \
  -H "Content-Type: application/json" \
  -d '{"referralCode":"REF123456","source":"email"}'

# Настройки
curl https://daten3-travelbackend.up.railway.app/api/affiliate/settings

# Обновить настройки
curl -X PUT https://daten3-travelbackend.up.railway.app/api/affiliate/settings \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"paypal","notifications":{"email":true}}'
```

---

### 11. 👑 Админ панель - Партнеры (4)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 45 | GET | `/api/admin/affiliates` | Все партнеры | 🔐 Admin |
| 46 | GET | `/api/admin/affiliates/:id` | Один партнер | 🔐 Admin |
| 47 | PATCH | `/api/admin/affiliates/:id/status` | Изменить статус | 🔐 Admin |
| 48 | PATCH | `/api/admin/affiliates/:id/verify` | Верифицировать | 🔐 Admin |

---

### 12. 👑 Админ панель - Комиссии (3)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 49 | GET | `/api/admin/commissions` | Все комиссии | 🔐 Admin |
| 50 | PATCH | `/api/admin/commissions/:id/approve` | Одобрить | 🔐 Admin |
| 51 | PATCH | `/api/admin/commissions/:id/reject` | Отклонить | 🔐 Admin |

---

### 13. 👑 Админ панель - Выплаты (4)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 52 | GET | `/api/admin/payouts` | Все выплаты | 🔐 Admin |
| 53 | POST | `/api/admin/payouts/:id/process` | Обработать | 🔐 Admin |
| 54 | PATCH | `/api/admin/payouts/:id/complete` | Завершить | 🔐 Admin |
| 55 | PATCH | `/api/admin/payouts/:id/reject` | Отклонить | 🔐 Admin |

---

### 14. 👑 Админ панель - Настройки и Аналитика (3)

| № | Метод | Эндпоинт | Описание | Auth |
|---|-------|----------|----------|------|
| 56 | GET | `/api/admin/settings` | Настройки программы | 🔐 Admin |
| 57 | PUT | `/api/admin/settings` | Обновить настройки | 🔐 Admin |
| 58 | GET | `/api/admin/analytics` | Аналитика | 🔐 Admin |
| 59 | GET | `/api/admin/analytics/top-performers` | Топ партнеров | 🔐 Admin |

**Примеры:**

```bash
# Все партнеры
curl https://daten3-travelbackend.up.railway.app/api/admin/affiliates \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Настройки
curl https://daten3-travelbackend.up.railway.app/api/admin/settings \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Аналитика
curl https://daten3-travelbackend.up.railway.app/api/admin/analytics \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Топ партнеров
curl https://daten3-travelbackend.up.railway.app/api/admin/analytics/top-performers \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📊 Сводная таблица

| Категория | Количество | Статус |
|-----------|------------|--------|
| Здоровье | 2 | ✅ |
| Информация | 1 | ✅ |
| Поиск отелей | 2 | ✅ |
| Поиск рейсов | 2 | ✅ |
| Auth - Публичные | 7 | ✅ |
| Auth - Защищенные | 4 | ✅ |
| Бронирования | 5 | ✅ |
| Избранное | 4 | ✅ |
| Ценовые уведомления | 4 | ⚠️ 501 |
| Партнерская программа | 13 | ✅ |
| Админ - Партнеры | 4 | 🔐 |
| Админ - Комиссии | 3 | 🔐 |
| Админ - Выплаты | 4 | 🔐 |
| Админ - Настройки | 3 | 🔐 |
| **ВСЕГО** | **58** | **54 работают** |

> **Примечание**: В корневом эндпоинте `/` показаны только **основные категории**, а не все 58 эндпоинтов!

---

## 🚀 Быстрый тест

Запустите скрипт для проверки всех эндпоинтов:

```bash
cd backend
chmod +x quick-test.sh
./quick-test.sh
```

Или полный тест:

```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔍 Почему в `/` показано только 9 категорий?

Корневой эндпоинт `/` предназначен для **обзора API**, а не для полного списка.
Это стандартная практика - показывать основные разделы API:

```json
{
  "endpoints": {
    "health": "/api/health",      // → содержит 2 эндпоинта
    "auth": "/api/auth",          // → содержит 11 эндпоинтов
    "hotels": "/api/hotels/search", // → 2 эндпоинта
    "flights": "/api/flights/search", // → 2 эндпоинта
    "affiliate": "/api/affiliate",  // → 13 эндпоинтов
    "bookings": "/api/bookings",    // → 5 эндпоинтов
    "favorites": "/api/favorites",  // → 4 эндпоинта
    "priceAlerts": "/api/price-alerts", // → 4 эндпоинта
    "admin": "/api/admin"           // → 14 эндпоинтов
  }
}
```

**Каждая категория** - это точка входа для группы связанных эндпоинтов.

---

## ✅ Заключение

- ✅ Бэкенд полностью работает
- ✅ 54 из 58 эндпоинтов работают отлично
- ⚠️ 4 эндпоинта (price-alerts) в разработке
- 🔐 14 админ эндпоинтов требуют роль администратора
- 📝 Mock данные используются (база данных будет подключена позже)

**Все эндпоинты задокументированы и готовы к тестированию!** 🎉
