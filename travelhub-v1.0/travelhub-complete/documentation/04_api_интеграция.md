# 🔌 API Интеграция TravelHub

## Обзор

TravelHub интегрируется с несколькими партнёрскими API для поиска отелей, авиабилетов и аренды автомобилей.

## 1. Booking.com API

### Регистрация

1. Перейдите на https://www.booking.com/affiliate
2. Зарегистрируйтесь как партнёр
3. Получите API ключ

### Endpoints

```javascript
// Поиск отелей
GET https://distribution-xml.booking.com/2.0/hotels

// Параметры
{
  destination: 'Paris',
  checkin: '2025-06-01',
  checkout: '2025-06-05',
  adults: 2,
  rooms: 1
}
```

### Комиссия

25-40% от стоимости бронирования

## 2. Skyscanner API

### Регистрация

1. https://partners.skyscanner.net
2. Создайте аккаунт
3. Получите API key

### Endpoints

```javascript
// Поиск авиабилетов
GET https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create

// Параметры
{
  query: {
    market: 'RU',
    locale: 'ru-RU',
    currency: 'RUB',
    queryLegs: [
      {
        originPlace: { queryPlace: { iata: 'MOW' }},
        destinationPlace: { queryPlace: { iata: 'LED' }},
        date: { year: 2025, month: 6, day: 1 }
      }
    ],
    adults: 1
  }
}
```

### Модель оплаты

CPC (Cost Per Click) или Revenue Share

## 3. Amadeus Travel API

### Регистрация

1. https://developers.amadeus.com
2. Создайте аккаунт разработчика
3. Получите Client ID и Secret

### Authentication

```javascript
POST https://test.api.amadeus.com/v1/security/oauth2/token

{
  grant_type: 'client_credentials',
  client_id: 'YOUR_CLIENT_ID',
  client_secret: 'YOUR_CLIENT_SECRET'
}
```

### Endpoints

```javascript
// Поиск отелей
GET https://test.api.amadeus.com/v3/shopping/hotel-offers

// Поиск авиабилетов
GET https://test.api.amadeus.com/v2/shopping/flight-offers
```

## Backend Implementation

```typescript
// src/services/api/booking.service.ts
import axios from 'axios';

export class BookingService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.BOOKING_API_KEY!;
  }
  
  async searchHotels(params: SearchParams) {
    const response = await axios.get(
      'https://distribution-xml.booking.com/2.0/hotels',
      {
        params: {
          ...params,
          apikey: this.apiKey
        }
      }
    );
    return response.data;
  }
}
```

## Error Handling

```typescript
try {
  const results = await bookingService.searchHotels(params);
  return results;
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded
    throw new Error('Too many requests');
  }
  throw error;
}
```

## Caching Strategy

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

export async function getCachedSearch(key: string, fetcher: Function) {
  const cached = cache.get(key);
  if (cached) return cached;
  
  const data = await fetcher();
  cache.set(key, data);
  return data;
}
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);
```
