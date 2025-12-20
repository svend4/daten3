# 🗄️ Настройка PostgreSQL базы данных для TravelHub Ultimate

## Фаза 10: Подключение базы данных

---

## 📋 Обзор

Мы используем **PostgreSQL** как основную базу данных и **Prisma ORM** для работы с ней.

### Что уже сделано:
- ✅ Установлен Prisma ORM (`@prisma/client`, `prisma`)
- ✅ Создана схема базы данных (`prisma/schema.prisma`)
- ✅ Определены 12 моделей данных

### Модели базы данных:
1. **User** - Пользователи
2. **Booking** - Бронирования
3. **Favorite** - Избранное
4. **PriceAlert** - Ценовые уведомления
5. **Affiliate** - Партнеры
6. **Referral** - Рефералы
7. **Commission** - Комиссии
8. **Payout** - Выплаты
9. **AffiliateClick** - Клики по реферальным ссылкам
10. **RefreshToken** - Токены обновления
11. **PasswordResetToken** - Токены сброса пароля

---

## 🚀 Быстрый старт (Railway)

### Шаг 1: Создать PostgreSQL сервис на Railway

1. Откройте **Railway Dashboard**: https://railway.app
2. Выберите ваш проект `daten3`
3. Нажмите **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. Railway автоматически создаст базу данных

### Шаг 2: Получить DATABASE_URL

1. Кликните на созданный PostgreSQL сервис
2. Перейдите на вкладку **"Variables"**
3. Скопируйте значение переменной **`DATABASE_URL`**

Формат будет примерно такой:
```
postgresql://postgres:PASSWORD@containers-us-west-XXX.railway.app:PORT/railway
```

### Шаг 3: Добавить в переменные окружения Backend

1. Откройте ваш Backend сервис в Railway
2. Перейдите на вкладку **"Variables"**
3. Добавьте новую переменную:
   - **Имя**: `DATABASE_URL`
   - **Значение**: (вставьте скопированный URL)
4. Нажмите **"Save"**

### Шаг 4: Запустить миграции

**Локально (для разработки):**

```bash
cd backend

# Создать .env файл с вашим DATABASE_URL
echo "DATABASE_URL=postgresql://..." > .env

# Сгенерировать Prisma Client
npx prisma generate

# Создать таблицы в базе
npx prisma migrate deploy

# Или для dev окружения с историей миграций
npx prisma migrate dev --name init
```

**На Railway (автоматически):**

Railway запустит миграции при деплое, если добавить в `package.json`:

```json
{
  "scripts": {
    "build": "tsc && npx prisma generate && npx prisma migrate deploy"
  }
}
```

---

## 📝 Подробная инструкция

### 1. Локальная разработка

#### 1.1. Установить PostgreSQL локально

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
- Скачать с https://www.postgresql.org/download/windows/
- Установить и запустить

#### 1.2. Создать базу данных

```bash
# Войти в PostgreSQL
psql postgres

# Создать базу
CREATE DATABASE travelhub;

# Создать пользователя (опционально)
CREATE USER travelhub_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE travelhub TO travelhub_user;

# Выйти
\q
```

#### 1.3. Настроить .env

```bash
cd backend
cp .env.example .env
```

Отредактируйте `.env`:
```env
DATABASE_URL="postgresql://travelhub_user:your_password@localhost:5432/travelhub"
```

### 2. Работа с Prisma

#### 2.1. Генерация Prisma Client

После любых изменений в `schema.prisma`:

```bash
npx prisma generate
```

Это создаст TypeScript типы и клиент в `node_modules/@prisma/client`

#### 2.2. Создание миграции

```bash
npx prisma migrate dev --name migration_name
```

Примеры:
```bash
npx prisma migrate dev --name init
npx prisma migrate dev --name add_user_avatar
npx prisma migrate dev --name update_booking_status
```

#### 2.3. Применение миграций (Production)

```bash
npx prisma migrate deploy
```

Используется на Railway/Production для применения существующих миграций.

#### 2.4. Откат миграции

```bash
npx prisma migrate resolve --rolled-back migration_name
```

#### 2.5. Сброс базы данных

⚠️ **ВНИМАНИЕ**: Удалит все данные!

```bash
npx prisma migrate reset
```

### 3. Prisma Studio (GUI для БД)

```bash
npx prisma studio
```

Откроется веб-интерфейс на `http://localhost:5555` для просмотра и редактирования данных.

---

## 🔧 Обновление кода

### 3.1. Создание Prisma клиента (Singleton)

Создайте файл `backend/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

### 3.2. Использование в контроллерах

**Пример: Auth Controller**

```typescript
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Хэширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      }
    });

    // Убрать пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};
```

**Пример: Bookings Controller**

```typescript
import prisma from '../lib/prisma.js';

export const getBookings = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
};

export const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, itemId, itemName, checkIn, checkOut, totalPrice } = req.body;

    const booking = await prisma.booking.create({
      data: {
        userId,
        type,
        itemId,
        itemName,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        totalPrice,
        status: 'pending'
      }
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
};
```

---

## 🌱 Seed данные (тестовые)

Создайте `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Создать тестовых пользователей
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      password: hashedPassword,
      firstName: 'Иван',
      lastName: 'Петров',
      role: 'user'
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Админ',
      lastName: 'Админов',
      role: 'admin'
    }
  });

  console.log('✅ Users created:', { user1, admin });

  // Создать тестовые бронирования
  await prisma.booking.create({
    data: {
      userId: user1.id,
      type: 'hotel',
      itemId: 'hotel_123',
      itemName: 'Отель Париж',
      checkIn: new Date('2025-06-01'),
      checkOut: new Date('2025-06-05'),
      guests: 2,
      totalPrice: 15000,
      status: 'confirmed'
    }
  });

  console.log('✅ Bookings created');

  // Создать тестового партнера
  await prisma.affiliate.create({
    data: {
      userId: user1.id,
      referralCode: 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      level: 1,
      status: 'active',
      verified: true
    }
  });

  console.log('✅ Affiliate created');

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Добавить в `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Запустить seed:

```bash
npx prisma db seed
```

---

## 🔍 Полезные команды Prisma

```bash
# Посмотреть статус миграций
npx prisma migrate status

# Форматировать schema.prisma
npx prisma format

# Валидация схемы
npx prisma validate

# Просмотр данных
npx prisma studio

# Pull схемы из существующей БД
npx prisma db pull

# Push схемы в БД (без миграций, для прототипирования)
npx prisma db push
```

---

## 📊 Структура базы данных

### Основные таблицы:

```
users (11 полей)
├── bookings (1:n)
├── favorites (1:n)
├── price_alerts (1:n)
└── affiliate (1:1)
    ├── referrals (1:n)
    ├── commissions (1:n)
    ├── payouts (1:n)
    └── clicks (1:n)
```

### Всего таблиц: 11
- `users`
- `bookings`
- `favorites`
- `price_alerts`
- `affiliates`
- `referrals`
- `commissions`
- `payouts`
- `affiliate_clicks`
- `refresh_tokens`
- `password_reset_tokens`

---

## ⚠️ Важные замечания

### Безопасность:

1. **Никогда не коммитьте .env файл!**
   - Добавлен в `.gitignore`
   - Используйте переменные окружения на Railway

2. **Используйте сильные пароли для БД**

3. **Регулярно делайте бэкапы**
   ```bash
   pg_dump -U username database_name > backup.sql
   ```

### Production:

1. **Connection Pooling**
   - Prisma автоматически управляет пулом соединений
   - Можно настроить: `connection_limit=10` в DATABASE_URL

2. **Мониторинг**
   - Railway автоматически показывает метрики БД
   - Настройте алерты для высокой нагрузки

3. **Индексы**
   - Уже добавлены в схему (@@index)
   - Prisma создаст их автоматически

---

## 🐛 Troubleshooting

### Ошибка: "Can't reach database server"

Проверьте:
```bash
# DATABASE_URL корректный?
echo $DATABASE_URL

# БД запущена?
pg_isready

# Правильный порт?
telnet localhost 5432
```

### Ошибка: "Table doesn't exist"

```bash
# Запустить миграции
npx prisma migrate deploy

# Или сбросить БД (локально)
npx prisma migrate reset
```

### Ошибка: "Column doesn't exist"

Схема обновилась, но миграция не применена:

```bash
npx prisma migrate dev --name update_schema
```

---

## ✅ Checklist для завершения Фазы 10

- [x] Установить Prisma
- [x] Создать schema.prisma
- [ ] Настроить PostgreSQL на Railway
- [ ] Добавить DATABASE_URL в переменные окружения
- [ ] Запустить миграции
- [ ] Создать `lib/prisma.ts`
- [ ] Обновить auth контроллер
- [ ] Обновить bookings контроллер
- [ ] Обновить favorites контроллер
- [ ] Обновить affiliate контроллеры
- [ ] Обновить admin контроллеры
- [ ] Создать seed файл
- [ ] Протестировать все эндпоинты
- [ ] Обновить документацию

---

## 🎯 Следующие шаги

После завершения Фазы 10:
1. **Фаза 11**: RBAC - система ролей
2. **Фаза 13**: Полная интеграция Travelpayouts API
3. **Фаза 14**: Улучшение Frontend

---

## 📚 Ресурсы

- Prisma Docs: https://www.prisma.io/docs
- PostgreSQL Docs: https://www.postgresql.org/docs
- Railway Docs: https://docs.railway.app
- Prisma Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
