# ✅ Быстрый Checklist Тестирования

## 📋 Тест за 5 минут

### Шаг 1: Проверка Frontend

**URL**: https://daten3-travel.up.railway.app

**Откройте в браузере и проверьте**:
- [ ] ✅ Страница загружается (не 404, не 502)
- [ ] ✅ Виден заголовок "TravelHub"
- [ ] ✅ Виден текст "Найдите идеальное путешествие"
- [ ] ✅ Есть табы "Отели" и "Авиабилеты"
- [ ] ✅ Есть форма поиска
- [ ] ✅ Есть footer

**Если НЕ работает**: Проверьте Railway Frontend Logs

---

### Шаг 2: Проверка Backend

**Откройте в браузере или curl**:

#### Health endpoint:
```
https://daten3-travelbackend.up.railway.app/health
```
- [ ] ✅ Возвращает JSON: `{"status":"ok",...}`

#### API Health:
```
https://daten3-travelbackend.up.railway.app/api/health
```
- [ ] ✅ Возвращает JSON: `{"status":"ok",...}`

#### Hotels API:
```
https://daten3-travelbackend.up.railway.app/api/hotels/search
```
- [ ] ✅ Возвращает: `{"message":"Hotels search endpoint"}`

#### Flights API:
```
https://daten3-travelbackend.up.railway.app/api/flights/search
```
- [ ] ✅ Возвращает: `{"message":"Flights search endpoint"}`

**Если НЕ работает**: Backend не задеплоен. См. `backend/RAILWAY_DEPLOY.md`

---

### Шаг 3: Проверка CORS интеграции

1. **Откройте**: https://daten3-travel.up.railway.app
2. **F12** → Console
3. **Вставьте код** из `quick-test.js`
4. **Проверьте результаты**:

- [ ] ✅ VITE_API_BASE_URL установлен
- [ ] ✅ Backend Health отвечает
- [ ] ✅ API Health отвечает
- [ ] ✅ Hotels API отвечает
- [ ] ✅ Flights API отвечает
- [ ] ✅ Нет CORS ошибок

**Если CORS ошибки**: Проверьте Backend Variables → FRONTEND_URL

---

### Шаг 4: Environment Variables

#### Frontend Variables (Railway Dashboard)
- [ ] ✅ `VITE_API_BASE_URL=https://daten3-travelbackend.up.railway.app/api`

#### Backend Variables (Railway Dashboard)
- [ ] ✅ `FRONTEND_URL=https://daten3-travel.up.railway.app`
- [ ] ✅ `NODE_ENV=production`
- [ ] ✅ `JWT_SECRET=...` (любой секретный ключ)

**PORT** - НЕ нужен! Railway устанавливает автоматически.

---

### Шаг 5: Railway Logs

#### Frontend Logs
```
Railway → Frontend Service → Deployments → View Logs
```
Должно быть:
- [ ] ✅ `Accepting connections at http://0.0.0.0:8080`

#### Backend Logs
```
Railway → Backend Service → Deployments → View Logs
```
Должно быть:
- [ ] ✅ `Server running on port 3000`

---

## 🎯 Результаты

### ✅ ВСЕ РАБОТАЕТ если:
- Все чекбоксы отмечены ✅
- Frontend загружается
- Backend отвечает на все endpoints
- Нет CORS ошибок
- Environment variables установлены

### ❌ ЕСТЬ ПРОБЛЕМЫ если:
- Frontend возвращает 404 → Проверьте `serve -s` флаг
- Backend не отвечает → Backend не задеплоен
- CORS ошибки → Проверьте FRONTEND_URL
- API запросы идут на localhost → Проверьте VITE_API_BASE_URL

---

## 📚 Дополнительная документация

- **Полный тест**: `INTEGRATION_TEST.md`
- **Backend деплой**: `backend/RAILWAY_DEPLOY.md`
- **Успешный деплой**: `DEPLOYMENT_SUCCESS.md`
- **Backend готовность**: `BACKEND_READY.md`

---

## 🚀 Quick Commands для тестирования

### Curl тесты:

```bash
# Backend Health
curl https://daten3-travelbackend.up.railway.app/health

# API Health
curl https://daten3-travelbackend.up.railway.app/api/health

# Hotels
curl https://daten3-travelbackend.up.railway.app/api/hotels/search

# Flights
curl https://daten3-travelbackend.up.railway.app/api/flights/search
```

### Browser Console тест:

```javascript
// Скопируйте код из quick-test.js
// Вставьте в Console (F12)
// Проверьте результаты
```

---

**Время тестирования**: ~5 минут
**Последнее обновление**: 2025-12-20

✅ **Готово к тестированию!**
