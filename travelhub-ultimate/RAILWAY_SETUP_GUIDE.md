# 🚂 Railway Setup Guide - Правильная настройка

> **ВАЖНО:** Railway не может найти Dockerfile? Следуйте этой инструкции!

## ❌ Проблема

Ошибка: `couldn't locate the dockerfile at path backend/Dockerfile in code archive`

**Причина:** Railway по умолчанию ищет файлы от корня репозитория, но проект находится в `travelhub-ultimate/`.

---

## ✅ Решение (3 варианта)

### **Вариант 1: Настройка Root Directory в Railway UI** ⭐ РЕКОМЕНДУЕТСЯ

Это самый простой и правильный способ!

#### Шаг 1: Откройте Railway Dashboard
```
https://railway.app/dashboard
```

#### Шаг 2: Создайте новый сервис
1. Нажмите **"+ New"**
2. Выберите **"GitHub Repo"**
3. Выберите репозиторий: `svend4/daten3`
4. Branch: `claude/extract-travel-agency-code-sdASp`

#### Шаг 3: Настройте Root Directory ⚠️ КРИТИЧЕСКИ ВАЖНО!

В настройках сервиса:
1. Перейдите в **Settings**
2. Найдите **"Root Directory"**
3. Укажите: `travelhub-ultimate/backend`
4. Нажмите **Save**

![Railway Root Directory](https://i.imgur.com/example.png)

#### Шаг 4: Railway автоматически найдет Dockerfile

После установки Root Directory:
- ✅ Dockerfile будет найден автоматически в `./Dockerfile`
- ✅ package.json будет найден в `./package.json`
- ✅ Все пути будут относительны от `travelhub-ultimate/backend/`

#### Шаг 5: Настройте переменные окружения

В **Settings → Variables** добавьте:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<your-secret-key>
BOOKING_API_KEY=<your-key>
SKYSCANNER_API_KEY=<your-key>
AMADEUS_API_KEY=<your-key>
```

#### Шаг 6: Deploy!

Railway автоматически начнет деплой после сохранения настроек.

---

### **Вариант 2: Использование Railway CLI с Root Directory**

```bash
# Установите Railway CLI
npm install -g @railway/cli

# Залогиньтесь
railway login

# Перейдите в директорию проекта
cd travelhub-ultimate/backend

# Инициализируйте Railway (выберите "Empty Project")
railway init

# Установите root directory (ВАЖНО!)
railway service --root travelhub-ultimate/backend

# Деплой
railway up

# Настройте переменные
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=your-secret-key

# Готово!
railway open
```

---

### **Вариант 3: Monorepo Setup (для продвинутых)**

Если вы хотите деплоить и frontend, и backend из одного репозитория:

#### Структура проекта:
```
daten3/
├── railway.toml                    # ← Для backend (корень)
└── travelhub-ultimate/
    ├── backend/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    ├── frontend/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    └── railway.toml                # ← Альтернативный конфиг
```

#### Создайте 2 сервиса в Railway:

**Service 1: Backend**
- Name: `travelhub-backend`
- Root Directory: `travelhub-ultimate/backend`
- Dockerfile Path: `Dockerfile` (автоматически)
- Start Command: `npm start`

**Service 2: Frontend**
- Name: `travelhub-frontend`
- Root Directory: `travelhub-ultimate/frontend`
- Dockerfile Path: `Dockerfile` (автоматически)
- Start Command: (автоматически из Dockerfile)

---

## 🔧 Проверка настройки

### 1. Проверьте Root Directory

В Railway UI → **Settings**:
```
✅ Root Directory: travelhub-ultimate/backend
❌ Root Directory: (пусто)
❌ Root Directory: travelhub-ultimate
```

### 2. Проверьте Build Settings

В Railway UI → **Settings → Build**:
```
✅ Builder: Dockerfile
✅ Dockerfile Path: Dockerfile (или ./Dockerfile)
❌ Dockerfile Path: backend/Dockerfile
❌ Dockerfile Path: travelhub-ultimate/backend/Dockerfile
```

### 3. Проверьте Start Command

В Railway UI → **Settings → Deploy**:
```
✅ Start Command: npm start
❌ Start Command: cd backend && npm start
❌ Start Command: node dist/index.js (если не в package.json)
```

---

## 🐛 Troubleshooting

### Ошибка: "couldn't locate the dockerfile"

**Решение:**
1. Перейдите в **Settings**
2. Установите **Root Directory** = `travelhub-ultimate/backend`
3. Убедитесь, что **Dockerfile Path** = `Dockerfile` (не `backend/Dockerfile`)
4. Сохраните и передеплойте

### Ошибка: "npm: not found" или "package.json not found"

**Решение:**
```bash
# Root Directory должна указывать на директорию с package.json!
Root Directory: travelhub-ultimate/backend  ✅

# НЕ на родительскую директорию
Root Directory: travelhub-ultimate  ❌
```

### Ошибка: "Cannot find module 'express'"

**Решение:**
Проверьте, что Dockerfile правильно устанавливает зависимости:
```dockerfile
# В Dockerfile должно быть:
COPY package*.json ./
RUN npm ci
```

### Ошибка: "Health check failed"

**Решение:**
1. Проверьте, что backend запустился:
   ```bash
   railway logs
   ```
2. Проверьте health check endpoint:
   ```bash
   # В коде должен быть:
   app.get('/api/health', (req, res) => {
     res.json({ status: 'ok' });
   });
   ```
3. Проверьте healthcheckPath в Settings:
   ```
   Settings → Deploy → Health Check Path: /api/health
   ```

---

## 📋 Checklist для успешного деплоя

- [ ] **Root Directory** установлена на `travelhub-ultimate/backend`
- [ ] **Dockerfile Path** = `Dockerfile` (автоматически)
- [ ] **Start Command** = `npm start` (или из package.json)
- [ ] **Environment Variables** настроены:
  - [ ] NODE_ENV=production
  - [ ] PORT=3000
  - [ ] DATABASE_URL (если PostgreSQL добавлен)
  - [ ] REDIS_URL (если Redis добавлен)
  - [ ] JWT_SECRET (сгенерирован)
  - [ ] API Keys (получены)
- [ ] **PostgreSQL** добавлен (если нужен)
- [ ] **Redis** добавлен (если нужен)
- [ ] **Health Check** настроен: `/api/health`
- [ ] **Миграции** выполнены: `railway run npm run migrate:deploy`

---

## 🎯 Быстрая настройка (копипаст)

### Railway UI Settings

**Root Directory:**
```
travelhub-ultimate/backend
```

**Dockerfile Path:** (оставьте пустым или)
```
Dockerfile
```

**Start Command:** (оставьте пустым, будет из package.json)

**Health Check Path:**
```
/api/health
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<paste-your-secret>
BOOKING_API_KEY=<paste-your-key>
SKYSCANNER_API_KEY=<paste-your-key>
AMADEUS_API_KEY=<paste-your-key>
```

---

## 🚀 После успешного деплоя

```bash
# Проверьте статус
railway status

# Посмотрите логи
railway logs

# Откройте приложение
railway open

# Проверьте health check
curl https://your-app.railway.app/api/health

# Ожидаемый ответ:
{
  "status": "ok",
  "timestamp": "2025-12-19T...",
  "uptime": 123.45
}
```

---

## 📞 Дополнительная помощь

**Railway Documentation:**
- Root Directory: https://docs.railway.app/deploy/builds#root-directory
- Dockerfile Builds: https://docs.railway.app/deploy/dockerfiles
- Config as Code: https://docs.railway.app/deploy/config-as-code

**TravelHub Issues:**
- GitHub: https://github.com/svend4/daten3/issues

---

**Готово!** 🎉

Теперь Railway должен успешно найти Dockerfile и задеплоить ваше приложение.

**Ключевой момент:** Всегда устанавливайте **Root Directory** на директорию, содержащую Dockerfile и package.json!
