# 🔍 ДИАГНОСТИКА RAILWAY - ЧТО СМОТРЕТЬ В ЛОГАХ

## ✅ Что я добавил:

1. **Диагностический wrapper** `start.js` с подробными логами
2. **CORS логи** показывают статус `FRONTEND_URL`
3. **Улучшенные сообщения об ошибках**

---

## 📊 ЧТО ВЫ УВИДИТЕ В НОВЫХ ЛОГАХ:

### ✅ УСПЕШНЫЙ ЗАПУСК:

```
🚀 Starting TravelHub Backend...
📁 Current directory: /app
📦 Node version: v20.x.x (или v18.x.x)
🔧 Platform: linux
🔍 Looking for: /app/dist/index.js
✅ File exists: true
📥 Loading backend...
🔧 CORS Configuration:
  FRONTEND_URL env: ❌ NOT SET           ← НУЖНО ДОБАВИТЬ!
  Allowed origins: ["http://localhost:3001", "http://localhost:5173"]
  NODE_ENV: not set
✅ Backend loaded successfully
Server running on port 8080

🎉 BACKEND РАБОТАЕТ!
```

**Действие:** Добавьте `FRONTEND_URL` в Variables

---

### ❌ ОШИБКА 1: dist/index.js не найден

```
🚀 Starting TravelHub Backend...
📁 Current directory: /app
📦 Node version: v20.x.x
🔧 Platform: linux
🔍 Looking for: /app/dist/index.js
✅ File exists: false                   ← ПРОБЛЕМА!
❌ ERROR: dist/index.js not found!
   Build may have failed.
   Check build logs above.
```

**Причина:** TypeScript build failed
**Решение:** Проверьте логи выше, найдите ошибку компиляции TypeScript

---

### ❌ ОШИБКА 2: Ошибка загрузки модуля

```
🚀 Starting TravelHub Backend...
📁 Current directory: /app
📦 Node version: v20.x.x
🔧 Platform: linux
🔍 Looking for: /app/dist/index.js
✅ File exists: true
📥 Loading backend...
❌ ERROR loading backend:
Error: Cannot find module 'express'
```

**Причина:** Зависимости не установлены
**Решение:** Проверьте `npm ci` в логах выше

---

### ❌ ОШИБКА 3: Синтаксическая ошибка

```
🚀 Starting TravelHub Backend...
...
📥 Loading backend...
❌ ERROR loading backend:
SyntaxError: Unexpected token ...
```

**Причина:** Проблема в коде или несовместимость версии Node
**Решение:** Проверьте версию Node, должна быть >= 18.0.0

---

## 🎯 ЧТО ДЕЛАТЬ:

### 1. Откройте Railway Logs
Railway Dashboard → Backend service → Deployments → Latest → View Logs

### 2. Найдите секцию "Starting TravelHub Backend"
Прокрутите вниз до строки с 🚀

### 3. Проверьте каждую строку:
- ✅ Node version >= 18.0.0?
- ✅ File exists: true?
- ✅ Backend loaded successfully?
- ✅ Server running on port XXXX?

### 4. Если всё ✅:
**Добавьте FRONTEND_URL:**
```
FRONTEND_URL=https://daten3-travel.up.railway.app
```

### 5. Если есть ❌:
- Скопируйте ПОЛНЫЕ логи с ошибкой
- Пришлите мне для анализа

---

## 📋 КАКИЕ ЛОГИ ПРИСЛАТЬ:

Если backend не запускается, пришлите:

1. **Build logs** (npm ci + npm run build)
2. **Start logs** (всё начиная с 🚀)
3. **Error logs** (всё с ❌)

**Формат:** Можете прислать весь блок текста или скриншот

---

## ⏱️ СЕЙЧАС ПРОИСХОДИТ:

1. Railway получил новый код
2. Запускается новый deploy (1-2 минуты)
3. Логи появятся с диагностикой
4. Мы точно увидим, что не так

**Подождите 2 минуты → Проверьте логи → Найдите 🚀**
