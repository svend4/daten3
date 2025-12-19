# 🚂 Деплой TravelHub на Railway

> Полное руководство по деплою TravelHub ULTIMATE на платформу Railway

## 📋 Содержание

1. [Что такое Railway?](#что-такое-railway)
2. [Стоимость](#стоимость)
3. [Быстрый старт](#быстрый-старт)
4. [Детальная инструкция](#детальная-инструкция)
5. [Настройка переменных окружения](#настройка-переменных-окружения)
6. [Настройка базы данных](#настройка-базы-данных)
7. [Мониторинг и логи](#мониторинг-и-логи)
8. [Troubleshooting](#troubleshooting)

---

## 🌟 Что такое Railway?

Railway - это современная платформа для деплоя приложений, которая автоматически:
- 🐳 Обнаруживает и использует Dockerfile
- 🗄️ Предоставляет PostgreSQL и Redis одним кликом
- 🔄 Автоматически деплоит при push в GitHub
- 📊 Показывает метрики и логи в реальном времени
- 🌐 Предоставляет бесплатный SSL сертификат

**Преимущества:**
- ✅ Проще и дешевле, чем AWS/Azure
- ✅ Бесплатный tier ($5 в месяц в кредитах)
- ✅ Автоматический CI/CD
- ✅ Встроенный PostgreSQL и Redis
- ✅ Простой UI

---

## 💰 Стоимость

```
┌─────────────────┬───────────┬──────────────────────────┐
│ Компонент       │ Цена      │ Комментарий              │
├─────────────────┼───────────┼──────────────────────────┤
│ Backend         │ $5/мес    │ 512MB RAM, 1 vCPU        │
│ PostgreSQL      │ $5/мес    │ 1GB storage              │
│ Redis           │ $3/мес    │ 256MB RAM                │
│ Frontend        │ $5/мес    │ Static hosting           │
├─────────────────┼───────────┼──────────────────────────┤
│ ИТОГО           │ $18/мес   │ Полный стек              │
├─────────────────┼───────────┼──────────────────────────┤
│ FREE TIER       │ $5/мес    │ В кредитах (Hobby Plan)  │
└─────────────────┴───────────┴──────────────────────────┘
```

**Рекомендация:** Начните с Hobby Plan ($5 в месяц в кредитах), этого достаточно для:
- Backend (один сервис)
- PostgreSQL (встроенный плагин)
- Небольшой трафик (~10K запросов/мес)

---

## 🚀 Быстрый старт (5 минут)

### Вариант 1: Один клик через GitHub (РЕКОМЕНДУЕТСЯ)

```bash
# 1. Установите Railway CLI (опционально)
npm install -g @railway/cli

# 2. Залогиньтесь в Railway
railway login

# 3. Создайте новый проект
railway init

# 4. Запустите деплой
railway up
```

### Вариант 2: Через веб-интерфейс

1. Откройте [railway.app](https://railway.app)
2. Нажмите "Start a New Project"
3. Выберите "Deploy from GitHub repo"
4. Выберите репозиторий `daten3` ветку `claude/extract-travel-agency-code-sdASp`
5. Railway автоматически обнаружит Dockerfile
6. Нажмите "Deploy"

**Готово!** Railway автоматически:
- ✅ Соберет Docker образ
- ✅ Запустит приложение
- ✅ Выдаст публичный URL (например, `https://travelhub-production.up.railway.app`)

---

## 📚 Детальная инструкция

### Шаг 1: Подготовка проекта

Проект уже готов к деплою! Файлы, которые мы создали:
- ✅ `railway.toml` - конфигурация для backend
- ✅ `railway-frontend.toml` - конфигурация для frontend
- ✅ `backend/Dockerfile` - Docker образ backend
- ✅ `frontend/Dockerfile` - Docker образ frontend
- ✅ `backend/.env.example` - шаблон переменных окружения

### Шаг 2: Создание проекта на Railway

#### Способ A: Через CLI

```bash
# Установите Railway CLI
npm install -g @railway/cli

# Залогиньтесь
railway login

# Перейдите в директорию проекта
cd travelhub-ultimate

# Инициализируйте проект
railway init
# Выберите: "Empty Project"
# Назовите проект: "TravelHub Production"

# Свяжите с веткой GitHub
railway link
```

#### Способ B: Через веб-интерфейс

1. Откройте [railway.app](https://railway.app) и войдите через GitHub
2. Нажмите **"New Project"**
3. Выберите **"Deploy from GitHub repo"**
4. Выберите репозиторий: `svend4/daten3`
5. Выберите ветку: `claude/extract-travel-agency-code-sdASp`
6. Root Directory: `travelhub-ultimate`

### Шаг 3: Создание сервисов

В Railway создайте **3 сервиса**:

#### Сервис 1: PostgreSQL Database

```bash
# Через CLI
railway add
# Выберите: PostgreSQL

# Или через UI:
# 1. Нажмите "+ New"
# 2. Выберите "Database"
# 3. Выберите "Add PostgreSQL"
```

Railway автоматически создаст переменную `DATABASE_URL`.

#### Сервис 2: Redis Cache

```bash
# Через CLI
railway add
# Выберите: Redis

# Или через UI:
# 1. Нажмите "+ New"
# 2. Выберите "Database"
# 3. Выберите "Add Redis"
```

Railway автоматически создаст переменную `REDIS_URL`.

#### Сервис 3: Backend API

```bash
# Через CLI
cd backend
railway up

# Или через UI:
# 1. Нажмите "+ New"
# 2. Выберите "GitHub Repo"
# 3. Root Directory: "travelhub-ultimate/backend"
# 4. Railway автоматически обнаружит Dockerfile
```

#### Сервис 4: Frontend (опционально)

```bash
# Через CLI
cd frontend
railway up

# Или через UI:
# 1. Нажмите "+ New"
# 2. Выберите "GitHub Repo"
# 3. Root Directory: "travelhub-ultimate/frontend"
```

**Альтернатива:** Деплой frontend на Vercel/Netlify (бесплатно):
```bash
# Vercel
cd frontend
vercel --prod

# Netlify
cd frontend
netlify deploy --prod
```

### Шаг 4: Настройка переменных окружения

#### Для Backend сервиса

В Railway UI перейдите в Backend сервис → **Variables** и добавьте:

```bash
# Основные
NODE_ENV=production
PORT=3000

# База данных (автоматически добавлены Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secret (сгенерируйте безопасный ключ)
JWT_SECRET=your-super-secret-jwt-key-here-change-this

# API Keys (получите на сайтах провайдеров)
BOOKING_API_KEY=your_booking_api_key
SKYSCANNER_API_KEY=your_skyscanner_api_key
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret

# CORS (URL вашего frontend)
FRONTEND_URL=https://your-frontend.vercel.app
```

**Генерация JWT_SECRET:**
```bash
# В терминале
openssl rand -base64 32
# или
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Для Frontend сервиса (если деплоите на Railway)

```bash
# API URL (URL вашего backend на Railway)
VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api

# Или статический URL после деплоя backend
VITE_API_BASE_URL=https://travelhub-backend-production.up.railway.app/api

# Google Analytics (опционально)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Шаг 5: Настройка домена (опционально)

#### Для Backend:

1. В Railway UI перейдите в Backend сервис → **Settings**
2. Найдите **Public Networking**
3. Railway автоматически выдаст домен: `https://travelhub-backend-production.up.railway.app`
4. Или добавьте свой домен:
   ```
   Custom Domain: api.travelhub.com
   ```

#### Для Frontend:

Если используете Vercel/Netlify, они автоматически выдадут домен.

### Шаг 6: Запуск миграций базы данных

После деплоя backend нужно запустить миграции:

```bash
# Через Railway CLI
railway run npm run migrate:deploy

# Или через Railway UI:
# 1. Перейдите в Backend сервис
# 2. Откройте вкладку "Deployments"
# 3. Найдите последний деплой
# 4. Нажмите "View Logs"
# 5. Проверьте, что миграции прошли успешно
```

**Если миграции не прошли автоматически:**

```bash
# Подключитесь к Railway shell
railway shell

# Запустите миграции
cd backend
npm run migrate:deploy

# Или seed данные (опционально)
npm run db:seed
```

### Шаг 7: Проверка деплоя

```bash
# Проверьте статус
railway status

# Откройте приложение в браузере
railway open

# Проверьте логи
railway logs
```

**Health Check:**
```bash
# Backend API
curl https://your-backend.up.railway.app/api/health

# Ожидаемый ответ:
{
  "status": "ok",
  "timestamp": "2025-12-19T21:00:00.000Z",
  "uptime": 1234.56,
  "database": "connected",
  "redis": "connected"
}
```

---

## 🔧 Настройка переменных окружения

### Получение API ключей

#### 1. Booking.com API

```
1. Зарегистрируйтесь на https://www.booking.com/affiliate
2. Создайте affiliate account
3. Получите Partner ID и API Key
```

#### 2. Skyscanner API

```
1. Зарегистрируйтесь на https://rapidapi.com/skyscanner/api/skyscanner-flight-search
2. Subscribe к бесплатному плану (1000 запросов/мес)
3. Скопируйте API Key
```

#### 3. Amadeus API

```
1. Зарегистрируйтесь на https://developers.amadeus.com
2. Создайте приложение (Self-Service tier бесплатный)
3. Получите API Key и API Secret
```

### Безопасность переменных окружения

✅ **ПРАВИЛЬНО:**
```bash
# В Railway UI используйте встроенные переменные
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
BACKEND_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

❌ **НЕПРАВИЛЬНО:**
```bash
# Не храните секреты в коде!
JWT_SECRET=123456  # Плохо!
DATABASE_URL=postgresql://user:password@localhost:5432/db  # Плохо!
```

---

## 🗄️ Настройка базы данных

### PostgreSQL на Railway

Railway автоматически создает PostgreSQL и предоставляет:
- `DATABASE_URL` - строка подключения
- `PGHOST` - хост
- `PGPORT` - порт (обычно 5432)
- `PGUSER` - пользователь
- `PGPASSWORD` - пароль
- `PGDATABASE` - имя базы данных

### Подключение к базе данных

```bash
# Через Railway CLI
railway connect postgres

# Откроется psql терминал
psql $DATABASE_URL

# Проверьте таблицы
\dt

# Проверьте данные
SELECT * FROM users LIMIT 5;
```

### Backup базы данных

```bash
# Создайте backup
railway run pg_dump $DATABASE_URL > backup.sql

# Восстановите backup
railway run psql $DATABASE_URL < backup.sql
```

### Миграции

```bash
# Через Prisma (если используете)
railway run npx prisma migrate deploy

# Через TypeORM (если используете)
railway run npm run typeorm migration:run

# Или custom SQL
railway run psql $DATABASE_URL < migrations/001_init.sql
```

---

## 📊 Мониторинг и логи

### Просмотр логов

```bash
# Через CLI
railway logs

# С фильтрацией
railway logs --filter "ERROR"

# Последние 100 строк
railway logs --tail 100

# Следить за логами в реальном времени
railway logs --follow
```

### Метрики в Railway UI

Railway автоматически показывает:
- 📈 **CPU Usage** - использование процессора
- 💾 **Memory Usage** - использование памяти
- 🌐 **Network I/O** - входящий/исходящий трафик
- ⏱️ **Response Times** - время ответа
- 🔄 **Request Count** - количество запросов

### Настройка алертов

В Railway UI:
1. Перейдите в **Project Settings**
2. **Notifications**
3. Добавьте email или webhook для уведомлений:
   - Deployment failed
   - High CPU usage
   - High memory usage
   - Service down

### Внешний мониторинг (рекомендуется)

**UptimeRobot** (бесплатно):
```
1. Зарегистрируйтесь на https://uptimerobot.com
2. Создайте HTTP(s) монитор
3. URL: https://your-backend.up.railway.app/api/health
4. Interval: 5 минут
5. Получайте уведомления при downtime
```

**Sentry** (error tracking):
```bash
# Установите Sentry SDK
npm install @sentry/node

# В backend/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

# Добавьте SENTRY_DSN в Railway Variables
```

---

## 🐛 Troubleshooting

### Проблема 1: Деплой падает с ошибкой "Cannot find module"

**Причина:** Зависимости не установлены или package.json некорректен

**Решение:**
```bash
# Проверьте package.json
cd backend
npm install
npm run build

# Если ошибки, исправьте и push
git add .
git commit -m "Fix dependencies"
git push
```

### Проблема 2: "Database connection failed"

**Причина:** DATABASE_URL не настроен или PostgreSQL не запущен

**Решение:**
```bash
# Проверьте переменную
railway variables

# Должна быть DATABASE_URL=${{Postgres.DATABASE_URL}}

# Проверьте PostgreSQL сервис
railway status

# Перезапустите PostgreSQL
railway restart postgres
```

### Проблема 3: "Port already in use"

**Причина:** PORT переменная не настроена или конфликт

**Решение:**
```bash
# В Railway Variables убедитесь:
PORT=3000

# В backend/src/index.ts используйте:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Проблема 4: CORS ошибки

**Причина:** Frontend не может обращаться к Backend API

**Решение:**
```bash
# В Backend Variables добавьте:
FRONTEND_URL=https://your-frontend.vercel.app

# В backend/src/index.ts:
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

### Проблема 5: "Out of memory"

**Причина:** Приложение использует больше памяти, чем доступно

**Решение:**
```bash
# В Railway UI увеличьте план:
# Settings → Usage → Upgrade Plan

# Или оптимизируйте код:
# - Добавьте кеширование (Redis)
# - Уменьшите размер ответов API
# - Используйте pagination
```

### Проблема 6: Медленный деплой (>5 минут)

**Причина:** Большой Docker образ или долгая сборка

**Решение:**
```bash
# Оптимизируйте Dockerfile:
# - Используйте multi-stage builds
# - Добавьте .dockerignore
# - Кешируйте node_modules

# Создайте .dockerignore в backend/:
node_modules
.git
.env
*.md
tests
coverage
```

### Проблема 7: "Health check failed"

**Причина:** Приложение не отвечает на health check endpoint

**Решение:**
```bash
# Добавьте health check endpoint в backend/src/index.ts:

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

# В railway.toml проверьте:
[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 100
```

---

## 🎯 Production Checklist

Перед запуском в production проверьте:

### Безопасность
- [ ] JWT_SECRET установлен и безопасный (минимум 32 символа)
- [ ] DATABASE_URL не хардкоден в коде
- [ ] API ключи хранятся только в Railway Variables
- [ ] CORS настроен только для вашего frontend
- [ ] Rate limiting включен
- [ ] Helmet.js установлен для security headers
- [ ] HTTPS enforced (Railway делает автоматически)

### Performance
- [ ] Redis кеширование настроено
- [ ] Database indexes созданы
- [ ] Static assets минифицированы
- [ ] Images оптимизированы
- [ ] Gzip compression включен

### Мониторинг
- [ ] Health check endpoint работает
- [ ] Логи корректно пишутся
- [ ] Sentry настроен для error tracking
- [ ] UptimeRobot мониторит доступность
- [ ] Email/Slack уведомления настроены

### Database
- [ ] Миграции прошли успешно
- [ ] Seed данные загружены (если нужно)
- [ ] Backup настроен
- [ ] Connection pooling настроен

### Frontend
- [ ] VITE_API_BASE_URL указывает на production backend
- [ ] Google Analytics настроен
- [ ] SEO meta tags добавлены
- [ ] Sitemap.xml загружен в Google Search Console
- [ ] Favicon и manifest.json настроены

---

## 🔄 CI/CD Workflow

Railway автоматически деплоит при push в GitHub:

```yaml
# .github/workflows/railway-deploy.yml (необязательно, Railway делает автоматически)

name: Deploy to Railway

on:
  push:
    branches: [main, claude/extract-travel-agency-code-sdASp]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        run: |
          # Railway автоматически подхватит изменения
          echo "Railway will auto-deploy on push"
```

**Автоматический workflow:**
1. Push в GitHub → Railway обнаруживает изменения
2. Railway собирает Docker образ
3. Railway запускает новый контейнер
4. Railway делает health check
5. Railway переключает трафик на новый контейнер
6. Zero-downtime deployment! 🎉

---

## 📞 Поддержка

**Railway Documentation:**
- https://docs.railway.app/

**TravelHub Issues:**
- GitHub Issues: https://github.com/svend4/daten3/issues

**Community:**
- Railway Discord: https://discord.gg/railway

---

## 💡 Советы и best practices

### 1. Используйте Railway Environments

Создайте несколько окружений:
```
- production (main branch)
- staging (staging branch)
- development (dev branch)
```

### 2. Автоматические бэкапы PostgreSQL

```bash
# Создайте cron job для бэкапов
railway run --service postgres pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Загрузите в S3 или Google Cloud Storage
```

### 3. Используйте Railway Templates

Railway предлагает готовые шаблоны для популярных стеков:
- Node.js + PostgreSQL
- Django + PostgreSQL
- Next.js + Prisma

### 4. Мониторьте затраты

```
Railway Dashboard → Usage
- Проверяйте usage каждую неделю
- Настройте budget alerts
- Оптимизируйте ресурсы
```

### 5. Review Logs регулярно

```bash
# Ищите ошибки
railway logs --filter "ERROR" --tail 100

# Анализируйте performance
railway logs --filter "slow query" --tail 50
```

---

## 🎉 Готово!

После завершения всех шагов у вас будет:

✅ **Backend API** на Railway с PostgreSQL и Redis
✅ **Frontend** на Vercel/Railway
✅ **Автоматический CI/CD** при push в GitHub
✅ **Мониторинг и алерты** через UptimeRobot и Sentry
✅ **Production-ready** приложение с SSL и кастомным доменом

**Ваш TravelHub доступен:**
- Backend: `https://travelhub-backend-production.up.railway.app`
- Frontend: `https://travelhub.vercel.app`
- API Docs: `https://travelhub-backend-production.up.railway.app/api/docs`

---

**Создано**: 19 декабря 2025
**Версия**: 1.0.0
**Автор**: TravelHub Team
