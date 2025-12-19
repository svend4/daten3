# 🚀 Deployment Guide

## Быстрое развертывание

### 1. Локальный запуск с Docker

```bash
# Запустите всё сразу
docker-compose up -d

# Проверьте статус
docker-compose ps

# Frontend: http://localhost:3001
# Backend: http://localhost:3000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### 2. Остановка

```bash
docker-compose down

# С удалением данных
docker-compose down -v
```

## Production деплой

### Вариант A: Vercel + Railway (Рекомендуется)

**Frontend (Vercel):**
```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

**Backend (Railway):**
```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway up
```

### Вариант B: Netlify + Render

**Frontend (Netlify):**
```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

**Backend (Render):**
- Подключите GitHub репозиторий
- Выберите backend директорию
- Автоматический деплой при push

### Вариант C: Custom VPS

```bash
# На вашем сервере
git clone your-repo
cd travelhub-complete
./deployment/scripts/deploy.sh

# Используйте nginx конфигурацию
sudo cp deployment/nginx/nginx.conf /etc/nginx/sites-available/travelhub
sudo ln -s /etc/nginx/sites-available/travelhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Environment Variables

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://api.travelhub.com
VITE_ENABLE_ANALYTICS=true
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Backend (.env.production)
```
NODE_ENV=production
PORT=3000
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
JWT_SECRET=your_secret_key
BOOKING_API_KEY=your_booking_key
SKYSCANNER_API_KEY=your_skyscanner_key
```

## Мониторинг

- **Uptime:** https://uptimerobot.com
- **Errors:** https://sentry.io
- **Analytics:** https://analytics.google.com

## CI/CD

GitHub Actions автоматически деплоит при push в main:
- Запускает тесты
- Собирает приложение
- Деплоит на production

## Troubleshooting

**Problem:** Docker build fails
```bash
docker-compose build --no-cache
```

**Problem:** Port already in use
```bash
# Измените порты в docker-compose.yml
```

**Problem:** Database connection error
```bash
# Проверьте DATABASE_URL
docker-compose logs db
```
