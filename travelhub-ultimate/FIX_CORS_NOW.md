# 🚨 ИСПРАВЛЕНИЕ CORS ОШИБКИ - 2 МИНУТЫ

## ❌ Что вы видите сейчас в логах:

```
Server running on port 8080
🔧 CORS Configuration:
  FRONTEND_URL env: ❌ NOT SET           ← ВОТ ПРОБЛЕМА!
  Allowed origins: ["http://localhost:3001", "http://localhost:5173"]
  NODE_ENV: not set

❌ CORS blocked: https://daten3-travel.up.railway.app
   Allowed origins: http://localhost:3001, http://localhost:5173
   💡 Set FRONTEND_URL environment variable to: https://daten3-travel.up.railway.app

Error: Not allowed by CORS
```

## ✅ РЕШЕНИЕ - Добавить одну переменную:

### Шаг 1: Откройте Railway Dashboard
https://railway.app

### Шаг 2: Найдите Backend service
Кликните на сервис:
- `daten3-travelbackend`
- или `backend`

### Шаг 3: Variables
Вверху нажмите вкладку **Variables**

### Шаг 4: New Variable
Нажмите **+ New Variable**

### Шаг 5: Заполните

**Variable name:**
```
FRONTEND_URL
```

**Value:**
```
https://daten3-travel.up.railway.app
```

⚠️ ВАЖНО:
- БЕЗ trailing slash в конце (не `.app/` а `.app`)
- Точно как написано выше

### Шаг 6: Save
Нажмите **Add** или **Save**

### Шаг 7: Подождите 2 минуты
Railway автоматически передеплоит backend.

## ✅ Что вы увидите после исправления:

```
Server running on port 8080
🔧 CORS Configuration:
  FRONTEND_URL env: https://daten3-travel.up.railway.app  ← ИСПРАВЛЕНО!
  Allowed origins: ["https://daten3-travel.up.railway.app"]
  NODE_ENV: not set

✅ CORS allowed: https://daten3-travel.up.railway.app     ← РАБОТАЕТ!
Hotels search params: { city: '...', ... }
Flights search params: { from: '...', to: '...', ... }
```

## 🎉 Результат:

Frontend сможет отправлять запросы на Backend!

---

## 📱 Проверка после исправления:

1. Откройте `mobile-test.html` в браузере
2. Заполните URLs:
   - Frontend: `https://daten3-travel.up.railway.app`
   - Backend: `https://daten3-travelbackend.up.railway.app`
3. Нажмите "🧪 Запустить тесты"
4. Должно быть: **5 из 5 тестов ✅**

---

**ВРЕМЯ: 2 минуты**
**ДЕЙСТВИЕ: Добавить ОДНУ переменную**
**РЕЗУЛЬТАТ: ВСЁ РАБОТАЕТ!** 🚀
