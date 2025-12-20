# 🔗 Как Frontend и Backend работают вместе

## 📊 Полная схема связи

```
┌─────────────────────────────────────────────────────────┐
│              1. User действие                           │
│  Пользователь кликает "Найти отели" на странице        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         2. Frontend Component (React)                   │
│  const { searchFlights } = useFlightSearch();           │
│  searchFlights({ from: 'Moscow', to: 'Paris' });        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         3. React Hook (useFlightSearch.ts)              │
│  await api.post('/flights/search', params);             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         4. API Client (utils/api.ts)                    │
│  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL│
│  axios.post(API_BASE_URL + '/flights/search', params)  │
│                                                          │
│  Полный URL:                                            │
│  https://daten3-travelbackend.up.railway.app/api       │
│         + '/flights/search'                             │
│  =                                                      │
│  https://daten3-travelbackend.up.railway.app/api/      │
│         flights/search                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTP POST Request
                      │ Headers: Content-Type: application/json
                      │ Body: { from: 'Moscow', to: 'Paris' }
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         5. Railway Network (CORS Check)                 │
│  Request origin: https://daten3-travel.up.railway.app  │
│  Backend FRONTEND_URL: https://daten3-travel...        │
│  ✅ CORS check passed                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         6. Backend Express Server                       │
│  app.post('/api/flights/search', (req, res) => {       │
│    const params = req.body;                            │
│    console.log('Search params:', params);               │
│    res.json({                                          │
│      flights: [...search results...]                   │
│    });                                                 │
│  });                                                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTP Response
                      │ Status: 200 OK
                      │ Body: { flights: [...] }
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         7. Frontend получает ответ                      │
│  setFlights(data.flights);                             │
│  // React компонент обновляется                         │
│  // Пользователь видит результаты поиска               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Ключевые компоненты связи

### 1. Environment Variable: `VITE_API_BASE_URL`

**Где устанавливается**: Railway → Frontend service → Variables

**Значение**: `https://daten3-travelbackend.up.railway.app/api`

**Как используется в коде**:
```javascript
// frontend/src/utils/api.ts (строка 3)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// При деплое на Railway:
API_BASE_URL = 'https://daten3-travelbackend.up.railway.app/api'

// При локальной разработке:
API_BASE_URL = 'http://localhost:3000/api'
```

---

### 2. API Client (axios)

**Файл**: `frontend/src/utils/api.ts`

**Как работает**:
```javascript
class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,  // ← Берёт из VITE_API_BASE_URL
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async post(url, data) {
    // url = '/flights/search'
    // Полный URL = baseURL + url
    // = 'https://daten3-travelbackend.up.railway.app/api' + '/flights/search'
    // = 'https://daten3-travelbackend.up.railway.app/api/flights/search'

    const response = await this.client.post(url, data);
    return response.data;
  }
}
```

---

### 3. React Hooks

**Файл**: `frontend/src/hooks/useFlightSearch.ts`

**Как используется в компонентах**:
```javascript
// В React компоненте:
import { useFlightSearch } from '../hooks/useFlightSearch';

function FlightSearchPage() {
  const { flights, loading, searchFlights } = useFlightSearch();

  const handleSearch = () => {
    searchFlights({
      from: 'Moscow',
      to: 'Paris',
      date: '2025-12-25'
    });
    // ↓
    // Это вызовет:
    // api.post('/flights/search', { from: 'Moscow', to: 'Paris', ... })
    // ↓
    // Что отправит POST запрос на:
    // https://daten3-travelbackend.up.railway.app/api/flights/search
  };

  return (
    <div>
      {loading && <p>Searching...</p>}
      {flights.map(flight => <FlightCard flight={flight} />)}
    </div>
  );
}
```

---

### 4. Backend Endpoints

**Файл**: `backend/src/index.ts`

**ОБНОВЛЕНО** - теперь принимает POST:

```javascript
// ✅ POST endpoint - принимает search params от frontend
app.post('/api/flights/search', (req, res) => {
  const searchParams = req.body;  // { from: 'Moscow', to: 'Paris' }

  console.log('Flights search params:', searchParams);

  // TODO: здесь будет реальная логика поиска
  res.json({
    message: 'Flights search endpoint',
    params: searchParams,
    flights: []  // Пока пустой, потом здесь будут реальные рейсы
  });
});

// Hotels endpoint - аналогично
app.post('/api/hotels/search', (req, res) => {
  const searchParams = req.body;
  res.json({
    message: 'Hotels search endpoint',
    params: searchParams,
    hotels: []  // Пока пустой, потом здесь будут реальные отели
  });
});
```

---

## 🎯 Что происходит при поиске

### Пример: Поиск авиабилетов

```
Шаг 1: User вводит
  От: Moscow
  До: Paris
  Дата: 2025-12-25
  Клик "Поиск"

Шаг 2: Frontend компонент
  searchFlights({
    from: 'Moscow',
    to: 'Paris',
    date: '2025-12-25'
  })

Шаг 3: Hook useFlightSearch
  await api.post('/flights/search', params)

Шаг 4: API Client
  POST https://daten3-travelbackend.up.railway.app/api/flights/search
  Body: { from: 'Moscow', to: 'Paris', date: '2025-12-25' }
  Headers: { Content-Type: application/json }

Шаг 5: Backend получает
  req.body = { from: 'Moscow', to: 'Paris', date: '2025-12-25' }
  console.log ← можете увидеть в Railway Logs!

Шаг 6: Backend отвечает
  res.json({
    flights: [
      { id: 1, from: 'Moscow', to: 'Paris', price: 15000 },
      { id: 2, from: 'Moscow', to: 'Paris', price: 18000 }
    ]
  })

Шаг 7: Frontend получает
  setFlights([...])
  React перерисовывает компонент
  User видит список рейсов!
```

---

## 🔧 Что нужно для работы

### ✅ Уже готово:

- [x] Frontend код с API client (api.ts)
- [x] Frontend hooks (useFlightSearch, useHotelSearch)
- [x] Backend endpoints (POST /api/flights/search, /api/hotels/search)
- [x] CORS настроен на backend
- [x] TypeScript скомпилирован

### ⏳ Нужно добавить:

1. **Environment Variable на Frontend**:
   ```
   Railway → Frontend → Variables → Add:
   VITE_API_BASE_URL=https://daten3-travelbackend.up.railway.app/api
   ```

2. **Environment Variable на Backend**:
   ```
   Railway → Backend → Variables → Add:
   FRONTEND_URL=https://daten3-travel.up.railway.app
   ```

3. **Redeploy Backend** (после обновления кода):
   - Railway автоматически передеплоит после push
   - Или вручную: Railway → Backend → Deployments → Redeploy

---

## 🧪 Как проверить что связь работает

### Способ 1: В браузере (если есть F12)

```javascript
// Откройте frontend: https://daten3-travel.up.railway.app
// F12 → Console

// Проверка 1: API URL установлен?
console.log(import.meta.env.VITE_API_BASE_URL);
// Должно: https://daten3-travelbackend.up.railway.app/api

// Проверка 2: POST запрос работает?
fetch(import.meta.env.VITE_API_BASE_URL + '/flights/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: 'Moscow', to: 'Paris' })
})
  .then(r => r.json())
  .then(d => console.log('✅ Backend ответил:', d))
  .catch(e => console.error('❌ Ошибка:', e));

// Должно вывести:
// ✅ Backend ответил: { message: "Flights search endpoint", flights: [] }
```

### Способ 2: На планшете (без F12)

1. **Откройте**: https://daten3-travel.up.railway.app
2. **Попробуйте поиск**: Заполните форму и нажмите "Поиск"
3. **Смотрите Backend logs**:
   ```
   Railway → Backend → Deployments → View Logs
   ```
4. **Должны увидеть**:
   ```
   Flights search params: { from: 'Moscow', to: 'Paris', ... }
   ```

Если видите параметры в логах = **СВЯЗЬ РАБОТАЕТ!** ✅

---

## 📊 Текущий статус endpoints

| Endpoint | Method | Frontend использует | Backend поддерживает | Статус |
|----------|--------|---------------------|----------------------|--------|
| /api/health | GET | ❌ Нет | ✅ Да | ✅ Работает |
| /api/flights/search | GET | ❌ Нет | ✅ Да (для тестов) | ℹ️ Опционально |
| /api/flights/search | POST | ✅ Да | ✅ Да (ОБНОВЛЕНО) | ✅ Готово |
| /api/hotels/search | GET | ❌ Нет | ✅ Да (для тестов) | ℹ️ Опционально |
| /api/hotels/search | POST | ✅ Да | ✅ Да (ОБНОВЛЕНО) | ✅ Готово |

---

## 🚀 Следующие шаги

### 1. Добавить переменные окружения (5 минут)
- Frontend: `VITE_API_BASE_URL`
- Backend: `FRONTEND_URL`

### 2. Redeploy Backend (автоматически)
После git push Railway автоматически передеплоит backend с новыми POST endpoints.

### 3. Проверить связь (2 минуты)
- Откройте frontend
- Попробуйте поиск
- Проверьте Backend logs

### 4. В будущем: Добавить реальные данные
Сейчас backend возвращает пустые массивы:
```javascript
flights: []  // ← Здесь будут реальные рейсы
hotels: []   // ← Здесь будут реальные отели
```

Когда добавите API ключи от поставщиков данных (Booking.com, Skyscanner и т.д.), здесь будут реальные результаты!

---

## ✅ Резюме

**Как они связаны**:
```
Frontend Component
  → useFlightSearch hook
    → api.post('/flights/search')
      → axios + VITE_API_BASE_URL
        → https://backend.../api/flights/search
          → Backend Express
            → res.json({ flights: [...] })
              → Frontend получает данные
                → User видит результаты!
```

**Что делает переменная VITE_API_BASE_URL**:
Она говорит frontend КУД отправлять запросы.
Без неё frontend будет пытаться обратиться к `localhost:3000` (не работает на Railway).

**Почему нужна FRONTEND_URL на backend**:
Для CORS - чтобы backend разрешил принимать запросы от вашего frontend домена.

---

**Готово к тестированию!** 🎉

После добавления переменных окружения всё заработает автоматически.
