# 🌱 Загрузка тестовых данных в PostgreSQL

## 📋 Когда использовать seed

**Seed НЕ ОБЯЗАТЕЛЕН**, но полезен для:
- ✅ Тестирования API с готовыми аккаунтами
- ✅ Демонстрации функционала партнёрской программы
- ✅ Проверки админ панели с данными

**Без seed:**
- База данных пустая
- Можно регистрировать пользователей через API
- Всё будет работать нормально

**С seed:**
- Сразу 3 готовых аккаунта
- Тестовые бронирования и рефералы
- Можно сразу логиниться и тестировать

---

## 🚀 Способ 1: Seed локально (РЕКОМЕНДУЕТСЯ)

### Шаг 1: Получить DATABASE_URL из Railway

```
1. Railway Dashboard → Postgres → Variables
2. Скопировать DATABASE_URL
```

**Пример:**
```
postgresql://postgres:LONG_PASSWORD@containers-us-west-123.railway.app:7654/railway
```

### Шаг 2: Запустить seed локально

```bash
cd /home/user/daten3/travelhub-ultimate/backend

# Создать .env файл
echo "DATABASE_URL=postgresql://postgres:..." > .env

# Установить зависимости (если ещё не установлены)
npm install

# Запустить seed
npm run prisma:seed
```

**Вывод:**
```
Running seed...
✅ Created admin user: admin@travelhub.com
✅ Created test user: user@travelhub.com
✅ Created affiliate user: affiliate@travelhub.com
✅ Created 3 sample bookings
✅ Created 2 referrals
✅ Created sample commissions
🌱 Database seeded successfully!
```

### Шаг 3: Проверить

```bash
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@travelhub.com",
    "password": "Test123!"
  }'
```

**Должно вернуть токены** ✅

---

## 🚀 Способ 2: Seed через Railway CLI (Альтернатива)

### Требования:
```bash
# Установить Railway CLI
npm install -g @railway/cli

# Залогиниться
railway login

# Связать с проектом
cd /home/user/daten3/travelhub-ultimate/backend
railway link
```

### Запустить seed:
```bash
railway run npm run prisma:seed
```

Railway автоматически использует DATABASE_URL из переменных окружения.

---

## 🚀 Способ 3: Через psql прямое подключение

Если есть psql клиент:

```bash
# Получить DATABASE_URL из Railway
export DATABASE_URL="postgresql://postgres:..."

# Подключиться
psql $DATABASE_URL

# Проверить таблицы
\dt

# Вручную добавить пользователя (пример)
INSERT INTO users (id, email, password, "firstName", "lastName", role, "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'test@example.com',
  '$2a$10$...',  -- bcrypt hash для "Test123!"
  'Test',
  'User',
  'user',
  true,
  now(),
  now()
);
```

**Но проще использовать Способ 1!**

---

## 📊 Что создаёт seed

### 3 тестовых аккаунта:

#### 1. Обычный пользователь
```
Email:    user@travelhub.com
Password: Test123!
Role:     user
```

#### 2. Администратор
```
Email:    admin@travelhub.com
Password: Test123!
Role:     admin
```

#### 3. Партнёр
```
Email:    affiliate@travelhub.com
Password: Test123!
Role:     user
Affiliate Code: REF001TRAVELHUB
Status: active, verified
```

### Тестовые данные:

- **3 бронирования** от user@travelhub.com:
  - Отель в Париже (5 ночей, €1,500)
  - Рейс Москва → Дубай (2 пассажира, €800)
  - Пакетный тур в Таиланд (€3,500)

- **2 реферала** для affiliate@travelhub.com:
  - user@travelhub.com (level 1)
  - Ещё один тестовый пользователь (level 1)

- **Комиссии** за бронирования рефералов

---

## ⚠️ Важно

### Пароли в seed

Все тестовые аккаунты используют пароль: `Test123!`

Хеш создаётся через bcrypt с 10 раундами:
```typescript
const hashedPassword = await bcrypt.hash('Test123!', 10);
```

### ID генерация

Все ID генерируются через `cuid()`:
```typescript
import { cuid } from '@paralleldrive/cuid2';
const userId = cuid();
```

### Уникальность

Seed можно запускать **только один раз** на пустую БД.

Если запустить повторно → ошибка:
```
Unique constraint failed on email
```

Чтобы сбросить БД:
```bash
# Удалить все данные
npx prisma migrate reset

# Заново создать таблицы и seed
npx prisma migrate deploy
npm run prisma:seed
```

---

## 🧪 Проверка после seed

### Test 1: Логин админа
```bash
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@travelhub.com",
    "password": "Test123!"
  }'
```

### Test 2: Получить бронирования
```bash
# Сначала получить токен из Test 1
curl https://daten3-travelbackend.up.railway.app/api/bookings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Должно вернуть 3 бронирования** ✅

### Test 3: Проверить партнёрскую программу
```bash
# Логин партнёра
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "affiliate@travelhub.com",
    "password": "Test123!"
  }'

# Получить dashboard
curl https://daten3-travelbackend.up.railway.app/api/affiliate/dashboard \
  -H "Authorization: Bearer AFFILIATE_TOKEN"
```

**Должно показать статистику рефералов** ✅

---

## 📝 Когда НЕ нужен seed

**Пропустить seed если:**
- Это production окружение (реальные пользователи)
- Хотите начать с чистой БД
- Будете тестировать через регистрацию

**В этом случае просто:**
```bash
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yourname@example.com",
    "password": "YourPassword123!",
    "firstName": "Your",
    "lastName": "Name"
  }'
```

И работать с API как обычно.

---

## 🎯 Итог

**Seed - это опционально:**
- ✅ **С seed**: Готовые тестовые аккаунты, можно сразу тестировать
- ✅ **Без seed**: Чистая БД, регистрируете пользователей через API

**Рекомендация:**
- Development/Testing → **использовать seed**
- Production → **НЕ использовать seed**

---

## 🚀 Быстрая команда

```bash
# Всё в одной команде
cd /home/user/daten3/travelhub-ultimate/backend && \
echo "DATABASE_URL=postgresql://..." > .env && \
npm run prisma:seed
```

**Время:** ~30 секунд
**Результат:** 3 готовых аккаунта для тестирования

---

## 📚 Связанные файлы

- **backend/prisma/seed.ts** - Скрипт для создания тестовых данных
- **NEXT_STEPS.md** - Что делать после подключения БД
- **DATABASE_URL_FIX.md** - Как настроить DATABASE_URL

---

**После seed - можно сразу тестировать все 41 эндпоинт!** 🎉
