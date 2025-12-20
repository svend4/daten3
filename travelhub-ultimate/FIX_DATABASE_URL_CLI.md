# 🚀 УСТАНОВКА DATABASE_URL через Railway CLI

## ❌ ПРОБЛЕМА

Railway UI **не сохраняет** DATABASE_URL (глюк с длинными переменными).
Текущий формат в UI неправильный - отсутствует имя сервиса.

**Было:**
```
postgresql://${{PGUSER}}:${{POSTGRES_PASSWORD}}@...
```

**Должно быть:**
```
postgresql://${{Postgres.PGUSER}}:${{Postgres.POSTGRES_PASSWORD}}@...
```

---

## ✅ РЕШЕНИЕ через Railway CLI

### Шаг 1: Установить Railway CLI

**На вашем компьютере (не в этой сессии):**

```bash
npm install -g @railway/cli
```

**ИЛИ через Homebrew (macOS):**
```bash
brew install railway
```

**ИЛИ скачать binary:**
https://github.com/railwayapp/cli/releases

---

### Шаг 2: Залогиниться в Railway

```bash
railway login
```

Откроется браузер для авторизации.

---

### Шаг 3: Связать с проектом

```bash
cd /path/to/your/travelhub-ultimate/backend

railway link
```

**Выберите:**
- Project: `dedb1029-702a-48bf-a345-fb7c7234d5da` (или по имени "appealing-determination")
- Environment: `production` (если спросит)
- Service: `77f3298c-10d8-4352-bcac-4f8607c1daea` (или "daten3" / "travel")

---

### Шаг 4: Установить DATABASE_URL

**ВАРИАНТ A: С Variable References (рекомендуется)**

```bash
railway variables set DATABASE_URL='postgresql://${{Postgres.PGUSER}}:${{Postgres.POSTGRES_PASSWORD}}@${{Postgres.RAILWAY_TCP_PROXY_DOMAIN}}:${{Postgres.RAILWAY_TCP_PROXY_PORT}}/${{Postgres.PGDATABASE}}'
```

**ВАЖНО:**
- На **macOS/Linux** используйте одинарные кавычки `'...'`
- На **Windows CMD** используйте двойные кавычки и экранирование: `"postgresql://..."`
- На **Windows PowerShell** используйте одинарные кавычки

---

**ВАРИАНТ B: Прямой URL (если вариант A не работает)**

Сначала получите DATABASE_PUBLIC_URL из Postgres:

```bash
# Список всех сервисов
railway service

# Переключиться на Postgres сервис
railway service postgres

# Показать переменные Postgres
railway variables

# Скопируйте значение DATABASE_PUBLIC_URL
```

Затем переключитесь обратно на backend и установите:

```bash
# Переключиться на backend сервис
railway service daten3

# Установить DATABASE_URL (вставьте скопированный URL)
railway variables set DATABASE_URL='postgresql://postgres:ВАSH_ПАРОЛЬ@monorail.proxy.rlwy.net:ПОРТ/railway'
```

---

### Шаг 5: Проверить

```bash
# Показать текущие переменные backend
railway variables

# Должны увидеть DATABASE_URL с правильным значением
```

---

### Шаг 6: Задеплоить

Railway автоматически задеплоит при изменении переменной, НО для уверенности:

```bash
railway up
```

ИЛИ сделайте push в git (Railway задеплоит автоматически).

---

## 🔍 Проверка после деплоя

Через 2-3 минуты откройте логи в Railway Dashboard:

**Должно быть:**
```
=== TravelHub Backend Startup ===

✅ DATABASE_URL is set

DATABASE_URL preview: postgresql://postgres:abc123...
DATABASE_URL length: 156 characters  ← НЕ 1 символ!

Database Configuration:
  Host: monorail.proxy.rlwy.net
  Port: 12345
  Database: railway
  User: postgres

Attempting database migrations...

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "railway"...

The following migration(s) have been applied:

migrations/
  └─ 20231220000000_init/
    └─ migration.sql

✔ Generated Prisma Client (v5.22.0)

✅ Migrations applied successfully!

Starting Express server...

🚀 Server is running on port 3000
```

---

## 🎯 Альтернатива: Railway Dashboard API

Если CLI не работает, можно через API:

```bash
# Получить API токен
railway whoami

# Установить переменную через API
curl -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { variableUpsert(input: { projectId: \"dedb1029-702a-48bf-a345-fb7c7234d5da\", environmentId: \"f8113581-8645-4066-93d4-661ee0c453ff\", serviceId: \"77f3298c-10d8-4352-bcac-4f8607c1daea\", name: \"DATABASE_URL\", value: \"postgresql://...\", }) { id } }"
  }'
```

---

## 📋 Troubleshooting

### Ошибка: "railway: command not found"

```bash
# Проверить установку
which railway

# Переустановить
npm uninstall -g @railway/cli
npm install -g @railway/cli

# ИЛИ добавить в PATH
export PATH="$PATH:$(npm bin -g)"
```

### Ошибка: "No project linked"

```bash
# Отвязать
railway unlink

# Привязать заново
railway link
```

### Ошибка: Variable references не работают

Используйте **Вариант B** - прямой URL вместо variable references.

---

## ✅ После успешной установки

1. ✅ DATABASE_URL будет иметь ~150+ символов (не 1!)
2. ✅ Миграции применятся автоматически
3. ✅ 12 таблиц создадутся в PostgreSQL
4. ✅ Все 41 API эндпоинт заработают
5. ✅ Можно тестировать регистрацию/логин

---

## 🎉 Тестовая команда

После успешного деплоя:

```bash
curl -X POST https://daten3-travelbackend.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Если вернёт токены** → ✅ **БАЗА ДАННЫХ РАБОТАЕТ!**

---

## 📞 Если ничего не помогло

Последний вариант - создать **новый** PostgreSQL plugin на Railway:

1. Railway → daten3 project → "+ New"
2. "Database" → "Add PostgreSQL"
3. Дождаться создания
4. Он автоматически создаст переменную DATABASE_URL в backend
5. Задеплоить

Railway автоматически свяжет сервисы.

---

**Удачи!** После установки DATABASE_URL через CLI всё заработает! 🚀
