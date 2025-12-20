# 🚀 БЫСТРЫЙ СТАРТ - PostgreSQL на Railway

## ⚡ 3 шага до полной работоспособности

### 📍 ШАГ 1: Создать PostgreSQL (2 минуты)

1. Открыть: https://railway.app/ → Проект **daten3**
2. Нажать **"+ New"** → **Database** → **Add PostgreSQL**
3. Дождаться создания (~30 секунд)
4. Кликнуть на новый сервис **Postgres**
5. Вкладка **Variables** → найти `DATABASE_URL`
6. **Скопировать** DATABASE_URL (иконка copy справа)

```
Формат URL:
postgresql://postgres:PASSWORD@containers-us-west-XXX.railway.app:5432/railway
```

---

### 📍 ШАГ 2: Подключить к Backend (1 минута)

1. Вернуться к списку сервисов (стрелка назад)
2. Кликнуть **daten3-travelbackend**
3. Вкладка **Variables** → **+ New Variable**
4. Заполнить:
   ```
   Name:  DATABASE_URL
   Value: postgresql://postgres:... [вставить скопированный URL]
   ```
5. Нажать **Add**

✅ **Railway автоматически запустит редеплой!**

---

### 📍 ШАГ 3: Проверить деплой (1 минута)

1. В **daten3-travelbackend** → вкладка **Deployments**
2. Кликнуть на **самый верхний** деплой (последний)
3. Нажать **View Logs**

#### ✅ Что должно быть в логах:

```bash
# 1. Миграции применяются
Running migrations...
Prisma schema loaded from prisma/schema.prisma

# 2. Prisma Client генерируется
✔ Generated Prisma Client (v5.22.0)

# 3. TypeScript компилируется БЕЗ ошибок
[нет строк с "error TS"]

# 4. Сервер запускается
🚀 Server is running on port XXXX
```

---

## ✅ ГОТОВО! Теперь можно тестировать

### Health Check
```bash
curl https://daten3-travelbackend.up.railway.app/health
```

**Ожидается:**
```json
{
  "success": true,
  "message": "TravelHub Backend is running"
}
```

### Регистрация пользователя
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

**Ожидается:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

## 🔧 Troubleshooting

### Проблема: "Prisma Client not initialized"
**Решение:** Проверить что DATABASE_URL добавлен в Variables

### Проблема: "Connection timeout"
**Решение:** Убедиться что URL полный (с паролем)

### Проблема: Старый деплой в логах (время 12:00-12:01)
**Решение:**
1. Проверить что коммит в деплое: `e686bf5` или `d163a6a`
2. Если старый → Settings → **Redeploy**

---

## 📊 Что работает после настройки

### ✅ 41 эндпоинт полностью рабочий:

**Аутентификация (9):**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me
- PUT /api/auth/profile
- PUT /api/auth/password
- DELETE /api/auth/account

**Бронирования (5):**
- GET /api/bookings
- GET /api/bookings/:id
- POST /api/bookings
- PATCH /api/bookings/:id/status
- DELETE /api/bookings/:id

**Избранное (4):**
- GET /api/favorites
- POST /api/favorites
- DELETE /api/favorites/:id
- GET /api/favorites/check/:type/:itemId

**Партнерская программа (13):**
- GET /api/affiliate/dashboard
- GET /api/affiliate/referral-tree
- GET /api/affiliate/stats
- POST /api/affiliate/register
- GET /api/affiliate/validate/:code
- GET /api/affiliate/earnings
- GET /api/affiliate/referrals
- GET /api/affiliate/payouts
- POST /api/affiliate/payouts/request
- GET /api/affiliate/links
- POST /api/affiliate/track-click
- GET /api/affiliate/settings
- PUT /api/affiliate/settings

**Админ панель (15):**
- GET /api/admin/affiliates
- GET /api/admin/affiliates/:id
- PATCH /api/admin/affiliates/:id/status
- PATCH /api/admin/affiliates/:id/verify
- GET /api/admin/commissions
- PATCH /api/admin/commissions/:id/approve
- PATCH /api/admin/commissions/:id/reject
- GET /api/admin/payouts
- POST /api/admin/payouts/:id/process
- PATCH /api/admin/payouts/:id/complete
- PATCH /api/admin/payouts/:id/reject
- GET /api/admin/settings
- PUT /api/admin/settings
- GET /api/admin/analytics
- GET /api/admin/analytics/top-performers

---

## 🎯 После настройки БД

### Опционально: Добавить тестовые данные
```bash
# Локально
cd backend
echo "DATABASE_URL=postgresql://..." > .env
npm run prisma:seed
```

**Тестовые аккаунты:**
```
Пользователь: user@travelhub.com / Test123!
Админ:         admin@travelhub.com / Test123!
Партнер:       affiliate@travelhub.com / Test123!
```

---

## 📚 Полная документация

- **RAILWAY_DATABASE_SETUP.md** - детальное руководство
- **RAILWAY_DEPLOY_CHECK.md** - проверка деплоя
- **PHASE_10_COMPLETED.md** - полное описание работы
- **PHASE_10_FINAL_STATUS.md** - итоговый статус

---

## 🎉 Фаза 10 завершена!

✅ Код: 100%
✅ Миграции: готовы
✅ Автодеплой: настроен
⏳ БД: осталось только добавить DATABASE_URL

**Время на настройку: ~4 минуты**

---

**Следующая фаза**: Фаза 11 - RBAC (после настройки БД)
