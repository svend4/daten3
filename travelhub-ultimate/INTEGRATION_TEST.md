# 🧪 Тестирование интеграции Frontend ↔ Backend

## 📋 Checklist для проверки

### 1. ✅ Проверка Frontend

**URL Frontend**: https://daten3-travel.up.railway.app

#### Тест 1: Загрузка страницы
```bash
# Откройте в браузере:
https://daten3-travel.up.railway.app

# Должно загрузиться:
✅ Главная страница TravelHub
✅ Заголовок "Найдите идеальное путешествие"
✅ Форма поиска с табами "Отели" и "Авиабилеты"
✅ Footer
```

#### Тест 2: React Router (SPA маршруты)
```bash
# После исправления serve -s флага, все маршруты должны работать:
https://daten3-travel.up.railway.app/
https://daten3-travel.up.railway.app/hotels
https://daten3-travel.up.railway.app/flights

# Все должны загрузить приложение (не 404)
```

---

### 2. ✅ Проверка Backend

**URL Backend**: https://daten3-travelbackend.up.railway.app (или ваш URL)

#### Тест 1: Health Check
```bash
curl https://daten3-travelbackend.up.railway.app/health

# Ожидается:
{
  "status": "ok",
  "timestamp": "2025-12-20T...",
  "uptime": 123.456
}
```

#### Тест 2: API Health
```bash
curl https://daten3-travelbackend.up.railway.app/api/health

# Ожидается:
{
  "status": "ok",
  "timestamp": "2025-12-20T...",
  "uptime": 123.456
}
```

#### Тест 3: API Endpoints
```bash
curl https://daten3-travelbackend.up.railway.app/api/hotels/search

# Ожидается:
{"message":"Hotels search endpoint"}

curl https://daten3-travelbackend.up.railway.app/api/flights/search

# Ожидается:
{"message":"Flights search endpoint"}
```

---

### 3. ✅ Проверка Environment Variables

#### Frontend Variables
**Railway Dashboard → Frontend Service → Variables**

Должна быть установлена:
```bash
VITE_API_BASE_URL=https://daten3-travelbackend.up.railway.app/api
```

**Как проверить**:
1. Откройте https://daten3-travel.up.railway.app
2. F12 → Console
3. Введите: `console.log(import.meta.env.VITE_API_BASE_URL)`
4. Должно вывести URL backend

#### Backend Variables
**Railway Dashboard → Backend Service → Variables**

Должны быть установлены:
```bash
FRONTEND_URL=https://daten3-travel.up.railway.app
NODE_ENV=production
JWT_SECRET=7f9d8a6e5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d
```

**PORT** - не нужен (Railway устанавливает автоматически)

---

### 4. ✅ Проверка CORS интеграции

#### Тест в браузере

1. **Откройте Frontend**: https://daten3-travel.up.railway.app
2. **Откройте DevTools**: F12 → Console
3. **Запустите тест**:

```javascript
// Тест 1: Проверка API URL
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);

// Тест 2: Запрос к backend
fetch(import.meta.env.VITE_API_BASE_URL + '/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend ответил:', data))
  .catch(err => console.error('❌ Ошибка:', err));

// Тест 3: Hotels API
fetch(import.meta.env.VITE_API_BASE_URL + '/hotels/search')
  .then(r => r.json())
  .then(data => console.log('✅ Hotels API:', data))
  .catch(err => console.error('❌ Ошибка:', err));
```

#### Что должно быть в Console:

✅ **Успешная интеграция**:
```
API URL: https://daten3-travelbackend.up.railway.app/api
✅ Backend ответил: {status: "ok", timestamp: "...", uptime: 123.456}
✅ Hotels API: {message: "Hotels search endpoint"}
```

❌ **CORS ошибка**:
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```
→ Проверьте FRONTEND_URL в backend variables

❌ **Network error**:
```
Failed to fetch
```
→ Backend не запущен или URL неправильный

---

### 5. ✅ Проверка Network Tab

1. **Откройте Frontend**: https://daten3-travel.up.railway.app
2. **DevTools**: F12 → Network tab
3. **Обновите страницу**: Ctrl+R
4. **Посмотрите запросы**:

Должны увидеть:
```
Status  Method  Domain                                File
200     GET     daten3-travel.up.railway.app         index.html
200     GET     daten3-travel.up.railway.app         /assets/index-[hash].js
200     GET     daten3-travel.up.railway.app         /assets/index-[hash].css
```

Если делаете API запросы:
```
200     GET     daten3-travelbackend.up.railway.app  /api/health
200     GET     daten3-travelbackend.up.railway.app  /api/hotels/search
```

**CORS headers должны быть**:
- `access-control-allow-origin: https://daten3-travel.up.railway.app`
- `access-control-allow-credentials: true`

---

### 6. 🔧 Проверка Railway Logs

#### Frontend Logs
```
Railway Dashboard → Frontend Service → Deployments → Latest → View Logs
```

Должны увидеть:
```bash
✅ Accepting connections at http://0.0.0.0:8080
✅ serve: Running on port 8080
```

#### Backend Logs
```
Railway Dashboard → Backend Service → Deployments → Latest → View Logs
```

Должны увидеть:
```bash
✅ Server running on port 3000
```

---

## 🎯 Полная интеграция - Тест сценарий

### Сценарий 1: Поиск отелей

1. Откройте https://daten3-travel.up.railway.app
2. Убедитесь что таб "Отели" активен
3. Откройте DevTools → Network
4. Введите данные поиска (город, даты)
5. Нажмите "Поиск"
6. В Network должен появиться запрос к `/api/hotels/search`
7. Status должен быть 200
8. Response должен содержать данные отелей

### Сценарий 2: Поиск авиабилетов

1. Переключите на таб "Авиабилеты"
2. Введите города отправления/прибытия
3. Выберите даты
4. Нажмите "Поиск"
5. Должен быть запрос к `/api/flights/search`
6. Status 200, response с данными

---

## 🐛 Troubleshooting

### Проблема: Frontend возвращает 404

**Решение**: Убедитесь что в package.json:
```json
"start": "serve -s dist -l $PORT"
```
Флаг `-s` обязателен для SPA!

### Проблема: CORS ошибки

**Проверьте Backend Variables**:
```bash
FRONTEND_URL=https://daten3-travel.up.railway.app
```

**БЕЗ trailing slash!** ✅ `.app` ❌ `.app/`

### Проблема: API запросы идут на localhost

**Проверьте Frontend Variables**:
```bash
VITE_API_BASE_URL=https://daten3-travelbackend.up.railway.app/api
```

После добавления переменной нужен **redeploy frontend**!

### Проблема: Backend не отвечает

**Проверьте**:
1. Backend service запущен (зелёный статус)
2. Public Networking включено
3. Domain сгенерирован
4. Health endpoint работает

---

## ✅ Checklist успешной интеграции

- [ ] Frontend загружается (https://daten3-travel.up.railway.app)
- [ ] SPA routing работает (нет 404 на маршрутах)
- [ ] Backend health endpoint отвечает
- [ ] Backend API endpoints работают
- [ ] Environment variables установлены (frontend и backend)
- [ ] Нет CORS ошибок в Console
- [ ] API запросы в Network идут на backend URL
- [ ] Backend logs показывают "Server running"
- [ ] Frontend logs показывают "Accepting connections"

---

## 📊 Ожидаемая архитектура

```
┌─────────────────────────────────────────────┐
│              User Browser                   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Frontend (daten3-travel.up.railway.app)    │
│  ├─ serve -s dist -l 8080                   │
│  ├─ React + Vite                            │
│  └─ VITE_API_BASE_URL → backend             │
└──────────────────┬──────────────────────────┘
                   │ API Requests
                   ▼
┌─────────────────────────────────────────────┐
│  Backend (daten3-travelbackend.up.railway...)│
│  ├─ Express :3000                           │
│  ├─ CORS: FRONTEND_URL                      │
│  └─ Routes:                                 │
│     ├─ /health                              │
│     ├─ /api/health                          │
│     ├─ /api/hotels/search                   │
│     └─ /api/flights/search                  │
└─────────────────────────────────────────────┘
```

---

**Готово к тестированию!** 🚀

Следуйте чеклисту выше и проверьте каждый пункт.
