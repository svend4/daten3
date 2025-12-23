# ✅ Frontend Deploy Checklist - Render

## 🚨 ВАЖНО: Перед деплоем на Render

### Шаг 1: Узнать URL вашего Backend

1. Откройте [Render Dashboard](https://dashboard.render.com)
2. Найдите ваш **Backend Web Service**
3. Скопируйте URL (например: `https://travelhub-xyz.onrender.com`)

### Шаг 2: Обновить .env файл

Отредактируйте файл `frontend/.env`:

```env
# Замените URL на НАСТОЯЩИЙ URL вашего backend!
VITE_API_BASE_URL=https://ваш-backend.onrender.com/api
```

**Пример:**
```env
VITE_API_BASE_URL=https://travelhub-backend-xyz.onrender.com/api
```

### Шаг 3: Коммит изменений

```bash
cd /home/user/daten3/travelhub-ultimate
git add frontend/.env
git commit -m "fix: Add production .env with correct backend URL"
git push origin main
```

---

## 🚀 Деплой на Render

### Вариант А: Static Site (Рекомендуется для фронтенда)

1. Render Dashboard → **"New +"** → **"Static Site"**
2. Подключите GitHub репозиторий
3. **Настройки:**
   - **Name**: `travelhub-frontend`
   - **Branch**: `main`
   - **Root Directory**: `travelhub-ultimate/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables** (добавьте в Render UI):
   ```
   VITE_API_BASE_URL=https://ваш-backend.onrender.com/api
   ```

5. Нажмите **"Create Static Site"**

### Вариант Б: Web Service (если нужен сервер)

Если нужен Node.js сервер (например, для SSR):

1. Render Dashboard → **"New +"** → **"Web Service"**
2. **Настройки:**
   - **Name**: `travelhub-frontend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview` (или свой сервер)

---

## 🔗 Связать Frontend и Backend

### На Backend (Render Dashboard):

1. Откройте ваш **Backend Web Service**
2. **Environment** → Добавьте:
   ```
   FRONTEND_URL=https://travelhub-frontend.onrender.com
   ```
   (замените на НАСТОЯЩИЙ URL вашего frontend)

3. Сохраните → Backend автоматически перезапустится

### Проверка CORS:

Backend должен разрешать запросы с фронтенда. Проверьте логи:
```
🔧 CORS Configuration:
  FRONTEND_URL env: https://travelhub-frontend.onrender.com
  Allowed origins: [ 'https://travelhub-frontend.onrender.com' ]
```

---

## 🧪 Тестирование после деплоя

### Test 1: Открыть сайт
```
https://travelhub-frontend.onrender.com
```

### Test 2: Проверить DevTools Console

**Ожидается:**
```
[API] Initialized with base URL: https://backend.onrender.com/api ✅
Application initialized successfully ✅
```

**НЕ должно быть:**
```
Failed to fetch ❌
CORS error ❌
localhost:3000 ❌
```

### Test 3: Попробовать Login

1. Откройте `/login`
2. Введите email/пароль
3. Нажмите "Войти"
4. Проверьте **Network Tab**:
   ```
   POST https://backend.onrender.com/api/auth/login → 200 OK ✅
   ```

### Test 4: Попробовать Google OAuth

1. Откройте `/login`
2. Нажмите "Продолжить с Google"
3. **Должен:** редирект на Google login page

---

## 🔧 Troubleshooting

### Проблема: Build fails на Render

**Ошибка:** `Command "npm run build" exited with 1`

**Решение:**
1. Проверьте Build logs в Render
2. Убедитесь что все зависимости в `package.json`
3. Проверьте что `.env` не нужен для билда (Vite подставит переменные из Render Environment)

### Проблема: Белый экран после деплоя

**Ошибка:** Сайт открывается, но показывает белый экран

**Решение:**
1. Откройте DevTools Console
2. Проверьте ошибки
3. Вероятно проблема с путями - проверьте `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/', // Должен быть '/' для Render
   })
   ```

### Проблема: API requests идут на localhost

**Ошибка в Console:**
```
POST http://localhost:3000/api/auth/login net::ERR_CONNECTION_REFUSED
```

**Решение:**
1. Проверьте Environment Variables в Render:
   ```
   VITE_API_BASE_URL должен быть установлен!
   ```
2. Если установлен, пересоберите:
   - Settings → Manual Deploy

### Проблема: CORS errors

**Ошибка:**
```
Access to fetch at 'https://backend.onrender.com/api/auth/login'
from origin 'https://frontend.onrender.com' has been blocked by CORS policy
```

**Решение:**
1. На **Backend**, добавьте в Environment:
   ```
   FRONTEND_URL=https://точный-url-фронтенда.onrender.com
   ```
2. Убедитесь что нет лишних слешей
3. Проверьте backend logs - должно быть:
   ```
   Allowed origins: [ 'https://frontend.onrender.com' ]
   ```

### Проблема: Google OAuth redirect не работает

**Ошибка:** После Google login не возвращает на сайт

**Решение:**
1. На **Backend**, проверьте Google OAuth настройки:
   - Authorized redirect URIs должен содержать:
     ```
     https://backend.onrender.com/api/auth/google/callback
     ```
2. В Google Cloud Console → Credentials → OAuth 2.0 Client IDs

---

## 📊 Checklist перед запуском

- [ ] Backend задеплоен на Render и работает
- [ ] Frontend `.env` обновлен с правильным backend URL
- [ ] Backend `FRONTEND_URL` установлен на правильный frontend URL
- [ ] Google OAuth redirect URIs обновлены в Google Console
- [ ] Build проходит успешно локально (`npm run build`)
- [ ] Все изменения закоммичены в git
- [ ] Auto-deploy включен на Render

---

## 🎉 После успешного деплоя

Ваш сайт будет доступен по адресу:
```
https://travelhub-frontend.onrender.com
```

**Функционал должен работать:**
- ✅ Регистрация через email
- ✅ Вход через email
- ✅ Вход через Google
- ✅ Поиск отелей
- ✅ Поиск авиабилетов
- ✅ Бронирование
- ✅ Личный кабинет

---

## 🔄 Автоматический деплой

Чтобы каждый git push автоматически деплоился:

1. Static Site Settings → **Auto-Deploy**: Yes
2. Теперь при каждом `git push origin main` → автоматический деплой!

---

## 💰 Render Free Tier Limits

**Static Site (Free):**
- ✅ Unlimited bandwidth
- ✅ Глобальный CDN
- ✅ Автоматический SSL
- ✅ Не засыпает (в отличие от Web Service)
- ✅ **РЕКОМЕНДУЕТСЯ** для React/Vite приложений

**Web Service (Free):**
- ⚠️ Засыпает после 15 минут неактивности
- 💰 Upgrade to Starter ($7/мес) чтобы не засыпал

---

## 📝 Важные URLs

**После деплоя сохраните эти URLs:**

| Сервис | URL | Примечание |
|--------|-----|------------|
| Frontend | `https://travelhub-frontend-XXX.onrender.com` | Static Site |
| Backend | `https://travelhub-backend-XXX.onrender.com` | Web Service |
| Database | `dpg-XXX.oregon-postgres.render.com` | PostgreSQL |

---

**Удачного деплоя!** 🚀
