# 🚀 Backend Deployment на Railway

## ✅ Готово к деплою!

Все необходимые файлы созданы:
- ✅ `nixpacks.toml` - конфигурация сборки
- ✅ `package-lock.json` - зафиксированные зависимости
- ✅ `Dockerfile` - опционально (можно использовать nixpacks)
- ✅ TypeScript компилируется без ошибок

---

## 📋 Шаги для деплоя на Railway

### 1. Создать новый сервис в Railway

```
Railway Dashboard → New → Deploy from GitHub repo
```

### 2. Выбрать репозиторий и директорию

- **Repository**: Ваш GitHub repo (например: `svend4/daten3`)
- **Root Directory**: `travelhub-ultimate/backend`
- **Branch**: `claude/extract-travel-agency-code-sdASp` (или main после merge)

### 3. Railway автоматически обнаружит nixpacks.toml

Railway увидит `nixpacks.toml` и будет использовать Nixpacks для сборки.

**Процесс сборки**:
```bash
1. npm ci              # Чистая установка зависимостей
2. npm run build       # Компиляция TypeScript → JavaScript
3. npm start           # Запуск: node dist/index.js
```

### 4. Добавить Environment Variables

В Railway Dashboard → Variables:

```bash
# Frontend URL для CORS (ОБЯЗАТЕЛЬНО)
FRONTEND_URL=https://daten3-travelfrontend.up.railway.app

# Production mode
NODE_ENV=production

# JWT Secret (для аутентификации)
JWT_SECRET=7f9d8a6e5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d
```

**Примечание**: PORT устанавливается Railway автоматически (не нужно добавлять).

### 5. Включить Public Networking

```
Settings → Networking → Public Networking → Generate Domain
```

Railway создаст публичный URL вида:
```
https://daten3-travelbackend.up.railway.app
```

### 6. Deploy!

Нажмите **Deploy** и дождитесь завершения (~2-3 минуты).

---

## 🔍 Проверка деплоя

### Health Check

После успешного деплоя проверьте health endpoint:

```bash
curl https://[ваш-backend-url]/health

# Должен вернуть:
# {
#   "status": "ok",
#   "timestamp": "2025-12-20T...",
#   "uptime": 123.456
# }
```

### API Endpoint

```bash
curl https://[ваш-backend-url]/api/health

# Должен вернуть:
# {
#   "status": "ok",
#   "timestamp": "2025-12-20T...",
#   "uptime": 123.456
# }
```

### Logs

Проверьте логи в Railway Dashboard:

```
Railway Dashboard → Backend service → Deployments → Latest → View Logs
```

Вы должны увидеть:
```
Server running on port 3000
```

---

## 🔗 Интеграция с Frontend

После успешного деплоя backend, настройте frontend:

### 1. Скопируйте Backend URL

Из Railway Dashboard → Backend service → Settings → Public Networking

Пример: `https://daten3-travelbackend.up.railway.app`

### 2. Добавьте в Frontend Variables

Railway Dashboard → Frontend service → Variables:

```bash
VITE_API_BASE_URL=https://daten3-travelbackend.up.railway.app/api
```

**ВАЖНО**: URL должен заканчиваться на `/api`

### 3. Redeploy Frontend

После добавления переменной Railway автоматически передеплоит frontend.
Подождите ~2 минуты.

### 4. Проверьте интеграцию

Откройте frontend в браузере:
```
https://daten3-travelfrontend.up.railway.app
```

Откройте DevTools (F12) → Console:
- ✅ Нет CORS ошибок
- ✅ API запросы идут на backend URL
- ✅ Ответы приходят от backend

---

## 🎯 Текущая архитектура

```
┌─────────────────────────────────────────┐
│           Railway Platform              │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │───▶│   Backend    │  │
│  │  (Nixpacks)  │API │  (Nixpacks)  │  │
│  │              │    │              │  │
│  │  serve:8080  │    │ express:3000 │  │
│  │  React+Vite  │    │ TypeScript   │  │
│  └──────────────┘    └──────────────┘  │
│         │                    │          │
│  daten3-travelfrontend  daten3-travelbackend│
│  .up.railway.app        .up.railway.app │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Backend не запускается

**Проверьте логи**:
```
Railway Dashboard → Backend → Deployments → Logs
```

**Частые проблемы**:
- Не установлена переменная `FRONTEND_URL`
- TypeScript не скомпилировался (проверьте build logs)
- Ошибки в зависимостях (проверьте package-lock.json)

### CORS ошибки

**Проверьте**:
1. `FRONTEND_URL` в backend переменных совпадает с frontend URL
2. Нет trailing slash: `https://daten3-travelfrontend.up.railway.app` ✅
3. НЕ: `https://daten3-travelfrontend.up.railway.app/` ❌

### API не отвечает

**Проверьте**:
1. Public Networking включено
2. Domain сгенерирован
3. Backend service запущен (зелёный статус)
4. Health endpoint работает

---

## 📚 Полезные команды

```bash
# Проверить статус
railway status

# Логи backend
railway logs --service backend --follow

# Переменные backend
railway variables --service backend

# Redeploy backend
railway redeploy --service backend

# Test health
curl https://[backend-url]/health
curl https://[backend-url]/api/health
```

---

## ✨ Готово!

Backend готов к деплою на Railway. Следуйте шагам выше для успешного развёртывания.

**Файлы готовы**:
- ✅ `nixpacks.toml`
- ✅ `package-lock.json`
- ✅ `src/index.ts` (с CORS)
- ✅ Health check endpoints

**Следующий шаг**: Деплой на Railway!
