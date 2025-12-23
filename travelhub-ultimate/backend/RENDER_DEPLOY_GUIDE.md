# 🚀 Render Deployment Guide для TravelHub Backend

## Проблема и Решение

### ❌ Проблема:
Приложение преждевременно завершалось (SIGTERM) во время миграций БД на Render.

### ✅ Решение:
1. Увеличен timeout миграций до 120 секунд
2. Убран преждевременный `process.exit(0)`
3. Добавлен fallback для генерации Prisma Client
4. Добавлен `postinstall` hook для Prisma

---

## 📝 Шаги деплоя на Render

### 1. Подготовка репозитория

Убедитесь, что изменения закоммичены:

```bash
git add travelhub-ultimate/backend/start-render.mjs
git add travelhub-ultimate/backend/package.json
git add travelhub-ultimate/backend/render.yaml
git commit -m "fix: Render deployment - fix premature exit and increase migration timeout"
git push
```

### 2. Создание PostgreSQL базы данных

1. Откройте Render Dashboard
2. Нажмите "New +" → "PostgreSQL"
3. Заполните:
   - **Name:** travelhub-db
   - **Database:** travelhub_gqvi
   - **User:** travelhub_gqvi_user
   - **Region:** Oregon (US West)
   - **Plan:** Free
4. Нажмите "Create Database"
5. **Важно:** Скопируйте "Internal Database URL" (начинается с postgresql://)

### 3. Создание Web Service

1. Нажмите "New +" → "Web Service"
2. Подключите GitHub репозиторий
3. Выберите папку: `travelhub-ultimate/backend`
4. Заполните настройки:

#### Basic Settings:
- **Name:** travelhub-backend
- **Region:** Oregon (US West)
- **Branch:** main (или ваша ветка)
- **Root Directory:** travelhub-ultimate/backend
- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:render`

#### Advanced Settings:

**Plan:** Free

**Environment Variables:**

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste Internal Database URL from PostgreSQL service>

# JWT Secrets (сгенерируйте сложные строки)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long_12345678
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars_67890

# Frontend URL (если есть)
FRONTEND_URL=https://travelhub-frontend.onrender.com

# Stripe (опционально)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (опционально)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Travelpayouts API (опционально)
TRAVELPAYOUTS_TOKEN=your_token
TRAVELPAYOUTS_MARKER=your_marker

# Redis (опционально, если используете Redis Labs)
REDIS_URL=redis://...
```

**Health Check Path:** `/health`

5. Нажмите "Create Web Service"

### 4. Мониторинг деплоя

**Ожидаемые логи:**

```
=== TravelHub Backend Startup (Render) ===

✅ DATABASE_URL is set

Database Configuration:
  Host: dpg-...
  Port: 5432
  Database: travelhub_gqvi
  User: travelhub_gqvi_user

Running database migrations...

⏳ This may take up to 2 minutes on first deploy...

[Prisma migration output...]

✅ Migrations applied successfully!

🚀 Starting Express server...
════════════════════════════════════════

[Express server logs...]
═══════════════════════════════════════════════════
🚀 TravelHub Ultimate API Server
═══════════════════════════════════════════════════
📍 Port: 3000
🌍 Environment: production
...
✅ Server is ready to accept connections
═══════════════════════════════════════════════════
```

**Время деплоя:** 3-5 минут (первый деплой может занять до 7 минут)

---

## 🔍 Troubleshooting

### Problem: "Application exited early"

**Причина:** Скрипт `start-render.mjs` завершался до того, как Express сервер полностью запустился.

**Решение:** ✅ Исправлено - убран `process.exit(0)`, скрипт теперь остается активным.

### Problem: "npm error signal SIGTERM" во время миграций

**Причина:** Timeout миграций был слишком коротким (60 сек), Render посылал SIGTERM.

**Решение:** ✅ Увеличен timeout до 120 секунд.

### Problem: "Prisma Client is not generated"

**Причина:** Prisma Client не генерируется после npm install.

**Решение:** ✅ Добавлен `postinstall` hook в package.json.

### Problem: База данных не подключается

**Проверьте:**
1. DATABASE_URL правильно скопирован (Internal Database URL, не External!)
2. PostgreSQL сервис запущен и активен
3. Формат URL: `postgresql://user:password@host:port/database`

**Проверка в логах:**
```
Database Configuration:
  Host: dpg-...  <- должен быть внутренний Render хост
  Port: 5432
  Database: travelhub_gqvi
  User: travelhub_gqvi_user
```

### Problem: Миграции не применяются

**Варианты:**

1. **Первый деплой:**
   ```
   Миграции могут занять до 2 минут
   Дождитесь сообщения: ✅ Migrations applied successfully!
   ```

2. **Если миграции не найдены:**
   ```bash
   # Локально создайте миграцию
   cd travelhub-ultimate/backend
   npx prisma migrate dev --name init

   # Закоммитьте
   git add prisma/migrations/
   git commit -m "feat: Add initial database migration"
   git push
   ```

3. **Если миграции не применяются:**
   - Проверьте права пользователя БД
   - Проверьте, что БД пустая (первый деплой)
   - Попробуйте Manual Deploy в Render Dashboard

---

## ⚡ Оптимизация

### Ускорение деплоя:

1. **Кэширование зависимостей** (автоматически на Render)

2. **Уменьшение зависимостей:**
   ```json
   // В package.json переместите dev-зависимости в devDependencies
   ```

3. **Build cache:**
   Render автоматически кэширует `node_modules/` и `dist/`

### Мониторинг производительности:

1. **Health Check:** https://travelhub-backend.onrender.com/health

2. **API Documentation:** https://travelhub-backend.onrender.com/api-docs

3. **Metrics:** Render Dashboard → Metrics

---

## 🔐 Безопасность

### Обязательно установите:

1. **JWT_SECRET** - минимум 32 символа, случайная строка
   ```bash
   # Генерация в bash
   openssl rand -base64 32
   ```

2. **JWT_REFRESH_SECRET** - другая случайная строка
   ```bash
   openssl rand -base64 32
   ```

3. **DATABASE_URL** - используйте Internal Database URL (не External!)

4. **Stripe Webhook Secret** - скопируйте из Stripe Dashboard

### Не коммитьте в git:

- ❌ `.env` файл
- ❌ Секретные ключи
- ❌ Database credentials
- ✅ Используйте Environment Variables в Render

---

## 📊 Мониторинг

### Проверка работоспособности:

```bash
# Health check
curl https://travelhub-backend.onrender.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-12-23T13:00:00.000Z",
  "uptime": 123.456,
  "database": "connected",
  "redis": "connected" (если настроен)
}
```

### Логи:

1. Откройте Render Dashboard
2. Выберите "travelhub-backend" service
3. Нажмите "Logs" в левом меню
4. Фильтруйте по уровню: Info, Warn, Error

---

## 🚨 Common Errors

### Error: "Cannot find module './dist/index.js'"

**Причина:** Build не выполнился или TypeScript не скомпилировался.

**Решение:**
```bash
# Проверьте локально
npm run build

# Проверьте tsconfig.json
# Проверьте src/index.ts существует
```

### Error: "Port 3000 is already in use"

**Причина:** Render автоматически присваивает PORT из environment.

**Решение:** ✅ Код уже использует `process.env.PORT || 3000`

### Error: "Redis connection failed"

**Причина:** REDIS_URL не установлен или неверный.

**Решение:**
- Если Redis не нужен сейчас - приложение продолжит работу
- Для production - настройте Redis Labs или Upstash

---

## 📈 Scaling

### Free Plan Limitations:

- CPU: Shared
- RAM: 512 MB
- Disk: Ephemeral (временный)
- Bandwidth: 100 GB/month
- Sleep after 15 minutes inactivity
- Build time: 20 minutes max

### Upgrade Options:

**Starter Plan ($7/month):**
- No sleep
- 512 MB RAM
- Priority support

**Standard Plan ($25/month):**
- 2 GB RAM
- Faster builds
- Auto-scaling

---

## ✅ Чеклист успешного деплоя

- [ ] PostgreSQL база данных создана
- [ ] DATABASE_URL скопирован (Internal URL!)
- [ ] JWT_SECRET и JWT_REFRESH_SECRET установлены
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run start:render`
- [ ] Health Check Path: `/health`
- [ ] Логи показывают "Server is ready to accept connections"
- [ ] Health endpoint отвечает: `curl /health`
- [ ] API Documentation доступна: `/api-docs`

---

## 🎯 Next Steps

1. ✅ Backend задеплоен
2. 🔄 Настройте Frontend (отдельный Render service)
3. 🔗 Обновите FRONTEND_URL в backend environment
4. 🔗 Обновите BACKEND_URL в frontend environment
5. 🧪 Протестируйте все endpoints
6. 📧 Настройте Email service (SendGrid/Gmail)
7. 💳 Настройте Stripe webhooks
8. 📊 Настройте мониторинг (Sentry/LogRocket)

---

**Деплой создан:** 23 декабря 2025
**Версия:** 1.0
**Статус:** ✅ Готово к production

**Backend URL:** https://travelhub-backend.onrender.com
**API Docs:** https://travelhub-backend.onrender.com/api-docs
**Health Check:** https://travelhub-backend.onrender.com/health
