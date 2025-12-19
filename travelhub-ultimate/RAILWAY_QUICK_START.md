# 🚀 Railway Quick Start - TravelHub

> Самый быстрый способ задеплоить TravelHub на Railway за 5 минут

## ⚡ Быстрый старт (1 команда)

```bash
# Запустите автоматический скрипт
./deploy-railway.sh
```

Скрипт автоматически:
- ✅ Проверит Railway CLI
- ✅ Авторизует вас в Railway
- ✅ Создаст проект (если не существует)
- ✅ Задеплоит Backend, PostgreSQL, Redis
- ✅ Запустит миграции базы данных
- ✅ Покажет URL вашего приложения

---

## 📋 Вариант 2: Вручную (через CLI)

### Шаг 1: Установите Railway CLI

```bash
# macOS/Linux
npm install -g @railway/cli

# или через Homebrew (macOS)
brew install railway
```

### Шаг 2: Залогиньтесь

```bash
railway login
```

### Шаг 3: Инициализируйте проект

```bash
cd travelhub-ultimate
railway init
```

Выберите: **"Empty Project"**
Назовите: **"TravelHub Production"**

### Шаг 4: Добавьте базы данных

```bash
# PostgreSQL
railway add --database postgres

# Redis
railway add --database redis
```

### Шаг 5: Деплой Backend

```bash
cd backend
railway up
```

Railway автоматически:
- Обнаружит Dockerfile
- Соберет Docker образ
- Запустит контейнер
- Выдаст публичный URL

### Шаг 6: Настройте переменные окружения

В Railway UI (https://railway.app/dashboard):

**Backend → Variables:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<сгенерируйте: openssl rand -base64 32>
BOOKING_API_KEY=<ваш ключ>
SKYSCANNER_API_KEY=<ваш ключ>
AMADEUS_API_KEY=<ваш ключ>
```

### Шаг 7: Запустите миграции

```bash
railway run npm run migrate:deploy
```

### Шаг 8: Откройте приложение

```bash
railway open
```

**Готово!** 🎉

---

## 🌐 Вариант 3: Через Web UI

### 1. Откройте [railway.app](https://railway.app)

### 2. Нажмите "New Project"

### 3. Выберите "Deploy from GitHub repo"

### 4. Выберите репозиторий
- Repo: `svend4/daten3`
- Branch: `claude/extract-travel-agency-code-sdASp`
- Root Directory: `travelhub-ultimate/backend`

### 5. Добавьте PostgreSQL
- Нажмите "+ New"
- Выберите "Database"
- Выберите "Add PostgreSQL"

### 6. Добавьте Redis
- Нажмите "+ New"
- Выберите "Database"
- Выберите "Add Redis"

### 7. Настройте Variables (см. Шаг 6 выше)

### 8. Готово!

Railway автоматически задеплоит ваше приложение.

---

## 🔑 Получение API ключей

### Booking.com
```
1. https://www.booking.com/affiliate
2. Создайте affiliate account
3. Получите Partner ID
```

### Skyscanner
```
1. https://rapidapi.com/skyscanner
2. Subscribe к Free tier (1000 req/month)
3. Скопируйте API Key
```

### Amadeus
```
1. https://developers.amadeus.com
2. Создайте Self-Service app (free)
3. Получите API Key + Secret
```

---

## 📊 Полезные команды

```bash
# Статус проекта
railway status

# Логи в реальном времени
railway logs --follow

# Открыть в браузере
railway open

# Shell доступ
railway shell

# Переменные окружения
railway variables

# Рестарт сервиса
railway restart

# Подключение к PostgreSQL
railway connect postgres

# Запуск команд в production
railway run npm run migrate:deploy
```

---

## 🐛 Быстрый troubleshooting

### "Cannot find module"
```bash
cd backend
npm install
railway up
```

### "Database connection failed"
```bash
# Проверьте, что PostgreSQL добавлен
railway status

# Проверьте DATABASE_URL
railway variables | grep DATABASE_URL
```

### "Port already in use"
```bash
# В Railway Variables:
PORT=3000

# В backend/src/index.ts:
const PORT = process.env.PORT || 3000;
```

### CORS errors
```bash
# Backend Variables:
FRONTEND_URL=https://your-frontend.vercel.app

# Backend code:
app.use(cors({ origin: process.env.FRONTEND_URL }));
```

---

## 💰 Стоимость

```
Hobby Plan: $5/month (включает кредиты)
- Backend: ~$5/mo
- PostgreSQL: ~$5/mo
- Redis: ~$3/mo

Итого: ~$13/mo (но первый месяц $5 в кредитах бесплатно!)
```

**Альтернатива:**
- Frontend на Vercel (бесплатно)
- Backend + DB на Railway ($10/mo)
- **Итого: $10/mo**

---

## 📚 Документация

**Полная инструкция:**
→ [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

**Railway Docs:**
→ https://docs.railway.app/

**TravelHub Docs:**
→ [README_ULTIMATE.md](README_ULTIMATE.md)

---

## ✅ Checklist перед production

- [ ] Все API ключи получены
- [ ] JWT_SECRET сгенерирован и добавлен
- [ ] DATABASE_URL настроен автоматически
- [ ] REDIS_URL настроен автоматически
- [ ] Миграции выполнены
- [ ] Health check работает (`/api/health`)
- [ ] CORS настроен для вашего frontend
- [ ] Логи проверены (нет ошибок)
- [ ] Кастомный домен добавлен (опционально)

---

## 🎉 Что дальше?

После успешного деплоя:

1. **Мониторинг**
   - Настройте UptimeRobot для health checks
   - Добавьте Sentry для error tracking
   - Проверяйте логи регулярно

2. **Performance**
   - Включите Redis кеширование
   - Оптимизируйте database queries
   - Добавьте CDN для static assets

3. **SEO**
   - Загрузите sitemap.xml в Google Search Console
   - Проверьте Core Web Vitals
   - Добавьте Google Analytics

4. **Безопасность**
   - Включите rate limiting
   - Добавьте CAPTCHA на формы
   - Настройте SSL (Railway делает автоматически)

---

**Вопросы?** Откройте [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) для детальной инструкции.

**Успешного деплоя!** 🚀
