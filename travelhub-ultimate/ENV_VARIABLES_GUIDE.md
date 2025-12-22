# 🔐 Полная таблица переменных окружения TravelHub

## 📋 Содержание
- [Backend (.env)](#backend-env)
- [Frontend (.env)](#frontend-env)
- [Готовые конфигурации](#готовые-конфигурации)

---

## Backend (.env)

### 🖥️ **Конфигурация сервера**

| Переменная | Описание | Пример значения | Обязательная | По умолчанию |
|-----------|----------|-----------------|--------------|--------------|
| `NODE_ENV` | Окружение запуска | `development`, `production`, `test` | ✅ | `development` |
| `PORT` | Порт сервера | `3000`, `8080`, `5000` | ✅ | `3000` |
| `LOG_LEVEL` | Уровень логирования | `error`, `warn`, `info`, `debug` | ❌ | `info` |

---

### 🗄️ **База данных**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/travelhub` | ✅ |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | ✅ |
| `REDIS_PASSWORD` | Пароль Redis (если требуется) | `your_redis_password` | ❌ |
| `DATABASE_POOL_MIN` | Минимум соединений в пуле | `2` | ❌ |
| `DATABASE_POOL_MAX` | Максимум соединений в пуле | `10` | ❌ |

**Примеры DATABASE_URL:**
```bash
# Local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/travelhub

# Render PostgreSQL
DATABASE_URL=postgresql://travelhub_user:pass123@dpg-xxx.oregon-postgres.render.com/travelhub_db

# Railway PostgreSQL
DATABASE_URL=postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway

# Supabase
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
```

---

### 🔐 **Аутентификация и безопасность**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `JWT_SECRET` | Секретный ключ для JWT токенов | `super-secret-key-change-in-prod-2024` | ✅ |
| `JWT_REFRESH_SECRET` | Ключ для refresh токенов | `refresh-secret-key-change-2024` | ✅ |
| `JWT_EXPIRES_IN` | Время жизни access токена | `15m`, `1h`, `30m` | ✅ |
| `JWT_REFRESH_EXPIRES_IN` | Время жизни refresh токена | `7d`, `30d`, `90d` | ✅ |
| `BCRYPT_ROUNDS` | Раунды хеширования bcrypt | `10`, `12` | ❌ |
| `SESSION_SECRET` | Секрет для сессий | `session-secret-key-2024` | ❌ |

**⚠️ Важно для production:**
```bash
# Генерация безопасных ключей
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)
```

---

### 🌐 **OAuth провайдеры**

#### Google OAuth
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456-abc.apps.googleusercontent.com` | ❌ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `GOCSPX-xxxxxxxxxxxx` | ❌ |
| `GOOGLE_CALLBACK_URL` | Callback URL после авторизации | `http://localhost:3000/api/auth/google/callback` | ❌ |

#### Facebook OAuth (опционально)
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `FACEBOOK_APP_ID` | Facebook App ID | `1234567890123456` | ❌ |
| `FACEBOOK_APP_SECRET` | Facebook App Secret | `abc123def456ghi789` | ❌ |
| `FACEBOOK_CALLBACK_URL` | Callback URL | `http://localhost:3000/api/auth/facebook/callback` | ❌ |

---

### 🌍 **Frontend URLs**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `FRONTEND_URL` | URL фронтенда (для CORS) | `http://localhost:5173,http://localhost:3001` | ✅ |
| `ALLOWED_ORIGINS` | Дополнительные origins | `https://travelhub.com,https://www.travelhub.com` | ❌ |

**Для production:**
```bash
FRONTEND_URL=https://travelhub.com,https://www.travelhub.com
```

---

### 🛫 **API интеграции - Путешествия**

#### Travelpayouts (основной провайдер)
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `TRAVELPAYOUTS_TOKEN` | API токен Travelpayouts | `abcd1234efgh5678ijkl9012` | ✅ |
| `TRAVELPAYOUTS_MARKER` | Маркер партнера | `travelhub`, `yourbrand123` | ✅ |
| `TRAVELPAYOUTS_API_URL` | Базовый URL API | `https://api.travelpayouts.com` | ❌ |

**Где получить:**
1. Регистрация: https://www.travelpayouts.com/
2. Панель → API → Получить токен
3. Создать marker (уникальное имя)

#### Booking.com API (опционально)
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `BOOKING_API_KEY` | Booking.com API ключ | `booking_key_12345` | ❌ |
| `BOOKING_AFFILIATE_ID` | Affiliate ID | `123456` | ❌ |

#### Skyscanner API (опционально)
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `SKYSCANNER_API_KEY` | Skyscanner API ключ | `sky_key_12345` | ❌ |

#### Amadeus API (опционально)
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `AMADEUS_API_KEY` | Amadeus API ключ | `amadeus_key_12345` | ❌ |
| `AMADEUS_API_SECRET` | Amadeus API секрет | `amadeus_secret_12345` | ❌ |
| `AMADEUS_ENV` | Окружение Amadeus | `test`, `production` | ❌ |

---

### 💱 **Конвертация валют**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `CURRENCY_API_KEY` | Ключ для exchangerate-api.com | `free` (без ключа) или ваш ключ | ❌ |
| `CURRENCY_API_URL` | URL API валют | `https://api.exchangerate-api.com/v4/latest` | ❌ |
| `DEFAULT_CURRENCY` | Валюта по умолчанию | `USD`, `EUR`, `RUB` | ❌ |

**Примечание:** Currency service использует бесплатный API без ключа. Для production рекомендуется зарегистрироваться на https://www.exchangerate-api.com/

---

### 📧 **Email сервис**

#### SMTP (Gmail, Outlook и др.)
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `EMAIL_SERVICE` | Тип email сервиса | `smtp`, `sendgrid`, `mailgun` | ✅ |
| `SMTP_HOST` | SMTP хост | `smtp.gmail.com`, `smtp-mail.outlook.com` | ✅ (если SMTP) |
| `SMTP_PORT` | SMTP порт | `587` (TLS), `465` (SSL), `25` | ✅ (если SMTP) |
| `SMTP_SECURE` | Использовать SSL | `true`, `false` | ❌ |
| `SMTP_USER` | Email адрес отправителя | `your.email@gmail.com` | ✅ (если SMTP) |
| `SMTP_PASS` | Пароль приложения | `abcd efgh ijkl mnop` | ✅ (если SMTP) |
| `EMAIL_FROM` | От кого письма | `TravelHub <noreply@travelhub.com>` | ✅ |

**Для Gmail:**
1. Включить 2FA: https://myaccount.google.com/security
2. Создать App Password: https://myaccount.google.com/apppasswords
3. Использовать app password вместо обычного пароля

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # App Password (16 символов с пробелами)
```

#### SendGrid (альтернатива)
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `SENDGRID_API_KEY` | SendGrid API ключ | `SG.xxxxxxxxxxxxxxxxx` | ✅ (если SendGrid) |

#### Mailgun (альтернатива)
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `MAILGUN_API_KEY` | Mailgun API ключ | `key-xxxxxxxxxxxxxxxxx` | ✅ (если Mailgun) |
| `MAILGUN_DOMAIN` | Mailgun домен | `mg.yourdomain.com` | ✅ (если Mailgun) |

---

### 💳 **Платежные системы**

#### Stripe
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `STRIPE_PUBLIC_KEY` | Публичный ключ Stripe | `pk_test_51Abc...` или `pk_live_51Abc...` | ✅ (если Stripe) |
| `STRIPE_SECRET_KEY` | Секретный ключ Stripe | `sk_test_51Abc...` или `sk_live_51Abc...` | ✅ (если Stripe) |
| `STRIPE_WEBHOOK_SECRET` | Webhook секрет | `whsec_xxxxxxxxxxxxx` | ✅ (если Stripe) |
| `STRIPE_CURRENCY` | Валюта по умолчанию | `usd`, `eur`, `rub` | ❌ |

**Где получить:**
1. Регистрация: https://dashboard.stripe.com/register
2. Developers → API keys
3. Webhooks → Add endpoint → получить signing secret

#### PayPal
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `PAYPAL_CLIENT_ID` | PayPal Client ID | `AZabc123...` | ✅ (если PayPal) |
| `PAYPAL_CLIENT_SECRET` | PayPal Secret | `ECdef456...` | ✅ (если PayPal) |
| `PAYPAL_MODE` | Режим работы | `sandbox`, `live` | ✅ (если PayPal) |

---

### 📁 **Файловое хранилище**

#### AWS S3
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key | `AKIAIOSFODNN7EXAMPLE` | ✅ (если S3) |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | ✅ (если S3) |
| `AWS_REGION` | AWS регион | `us-east-1`, `eu-west-1`, `ap-southeast-1` | ✅ (если S3) |
| `AWS_S3_BUCKET` | Название S3 bucket | `travelhub-uploads` | ✅ (если S3) |
| `AWS_S3_ACL` | ACL по умолчанию | `public-read`, `private` | ❌ |

#### Cloudinary (альтернатива)
| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `CLOUDINARY_CLOUD_NAME` | Cloud name | `your-cloud-name` | ✅ (если Cloudinary) |
| `CLOUDINARY_API_KEY` | API ключ | `123456789012345` | ✅ (если Cloudinary) |
| `CLOUDINARY_API_SECRET` | API секрет | `abcdefghijklmnopqrstuvwxyz` | ✅ (если Cloudinary) |

---

### 💰 **Партнерская программа**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `AFFILIATE_COMMISSION_LEVEL_1` | Комиссия уровень 1 (прямые рефералы) | `5.0` (5%) | ❌ |
| `AFFILIATE_COMMISSION_LEVEL_2` | Комиссия уровень 2 | `2.5` (2.5%) | ❌ |
| `AFFILIATE_COMMISSION_LEVEL_3` | Комиссия уровень 3 | `1.0` (1%) | ❌ |
| `AFFILIATE_MIN_PAYOUT` | Минимальная сумма выплаты | `50.00` (USD) | ❌ |
| `AFFILIATE_COOKIE_DAYS` | Срок действия реф. cookie | `30` (дней) | ❌ |
| `AFFILIATE_DEFAULT_ENABLED` | Включить по умолчанию | `true`, `false` | ❌ |

**По умолчанию:**
```bash
AFFILIATE_COMMISSION_LEVEL_1=5.0
AFFILIATE_COMMISSION_LEVEL_2=2.5
AFFILIATE_COMMISSION_LEVEL_3=1.0
AFFILIATE_MIN_PAYOUT=50.00
```

---

### 🛡️ **Rate Limiting**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `RATE_LIMIT_WHITELIST` | IP адреса без лимитов | `127.0.0.1,192.168.1.1` | ❌ |
| `RATE_LIMIT_STRICT_MAX` | Строгий лимит (req/min) | `10` | ❌ |
| `RATE_LIMIT_MODERATE_MAX` | Средний лимит (req/min) | `30` | ❌ |
| `RATE_LIMIT_LENIENT_MAX` | Мягкий лимит (req/min) | `100` | ❌ |

---

### 📊 **Аналитика**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `GOOGLE_ANALYTICS_ID` | Google Analytics ID | `UA-XXXXX-X` или `G-XXXXXXXXXX` | ❌ |
| `GA4_MEASUREMENT_ID` | Google Analytics 4 ID | `G-XXXXXXXXXX` | ❌ |
| `MIXPANEL_TOKEN` | Mixpanel токен | `abc123def456` | ❌ |
| `HOTJAR_ID` | Hotjar Site ID | `1234567` | ❌ |
| `FACEBOOK_PIXEL_ID` | Facebook Pixel ID | `1234567890123456` | ❌ |

---

### 🔍 **Мониторинг и ошибки**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `SENTRY_DSN` | Sentry DSN для отслеживания ошибок | `https://xxx@sentry.io/123456` | ❌ |
| `SENTRY_ENVIRONMENT` | Окружение Sentry | `development`, `production` | ❌ |
| `SENTRY_TRACES_SAMPLE_RATE` | % транзакций для отслеживания | `1.0` (100%), `0.1` (10%) | ❌ |

---

### 🔔 **Push уведомления**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `FCM_SERVER_KEY` | Firebase Cloud Messaging ключ | `AAAAxxxxxxx:APA91bF...` | ❌ |
| `VAPID_PUBLIC_KEY` | VAPID публичный ключ | `BNxxxxxxxxxxxxxxx` | ❌ |
| `VAPID_PRIVATE_KEY` | VAPID приватный ключ | `xxxxxxxxxxxxxxx` | ❌ |

---

### 🌐 **CDN и статические файлы**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `CDN_URL` | URL CDN для статики | `https://cdn.travelhub.com` | ❌ |
| `STATIC_FILES_URL` | URL статических файлов | `https://static.travelhub.com` | ❌ |

---

### 📝 **Разное**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `MAX_FILE_SIZE` | Макс. размер загружаемого файла (байты) | `10485760` (10MB) | ❌ |
| `ALLOWED_FILE_TYPES` | Разрешенные типы файлов | `image/jpeg,image/png,application/pdf` | ❌ |
| `TIMEZONE` | Временная зона сервера | `Europe/Moscow`, `UTC`, `America/New_York` | ❌ |
| `DEFAULT_LANGUAGE` | Язык по умолчанию | `ru`, `en`, `de` | ❌ |
| `ENABLE_SWAGGER` | Включить Swagger docs | `true`, `false` | ❌ |
| `ENABLE_GRAPHQL` | Включить GraphQL | `true`, `false` | ❌ |

---

## Frontend (.env)

### 🖥️ **Конфигурация**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `VITE_API_BASE_URL` | URL backend API | `http://localhost:3000/api` | ✅ |
| `VITE_API_TIMEOUT` | Таймаут API запросов (мс) | `30000` (30 сек) | ❌ |
| `VITE_APP_NAME` | Название приложения | `TravelHub` | ❌ |
| `VITE_APP_VERSION` | Версия приложения | `1.0.0` | ❌ |

**Для production:**
```bash
VITE_API_BASE_URL=https://api.travelhub.com/api
```

---

### 📊 **Аналитика**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `VITE_ENABLE_ANALYTICS` | Включить аналитику | `true`, `false` | ❌ |
| `VITE_GA_TRACKING_ID` | Google Analytics ID | `UA-XXXXX-X` | ❌ |
| `VITE_SENTRY_DSN` | Sentry DSN | `https://xxx@sentry.io/123456` | ❌ |

---

### 🗺️ **Карты**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API ключ | `AIzaSyXXXXXXXXXXXXXXXXXXX` | ❌ |
| `VITE_MAPBOX_TOKEN` | Mapbox токен | `pk.eyJ1XXXXXXXXXXXXXXX` | ❌ |

---

### 💳 **Платежи (клиентская часть)**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `VITE_STRIPE_PUBLIC_KEY` | Stripe публичный ключ | `pk_test_51Abc...` | ❌ |
| `VITE_PAYPAL_CLIENT_ID` | PayPal Client ID | `AZabc123...` | ❌ |

---

### 🔐 **OAuth (клиентская часть)**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456-abc.apps.googleusercontent.com` | ❌ |
| `VITE_FACEBOOK_APP_ID` | Facebook App ID | `1234567890123456` | ❌ |

---

### 🌐 **Разное**

| Переменная | Описание | Пример значения | Обязательная |
|-----------|----------|-----------------|--------------|
| `VITE_ENABLE_DEVTOOLS` | Включить devtools | `true`, `false` | ❌ |
| `VITE_DEFAULT_LANGUAGE` | Язык по умолчанию | `ru`, `en` | ❌ |
| `VITE_DEFAULT_CURRENCY` | Валюта по умолчанию | `USD`, `EUR`, `RUB` | ❌ |

---

## 📦 Готовые конфигурации

### Development (локальная разработка)

**Backend `.env`:**
```bash
# Server
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/travelhub
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=dev-secret-key-change-in-production-2024
JWT_REFRESH_SECRET=dev-refresh-secret-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:5173,http://localhost:3001

# Travelpayouts (получить на travelpayouts.com)
TRAVELPAYOUTS_TOKEN=your_token_here
TRAVELPAYOUTS_MARKER=travelhub

# Email (Gmail)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password_here
EMAIL_FROM=TravelHub <noreply@travelhub.com>

# Affiliate
AFFILIATE_COMMISSION_LEVEL_1=5.0
AFFILIATE_COMMISSION_LEVEL_2=2.5
AFFILIATE_COMMISSION_LEVEL_3=1.0
AFFILIATE_MIN_PAYOUT=50.00

# Misc
MAX_FILE_SIZE=10485760
ENABLE_SWAGGER=true
```

**Frontend `.env`:**
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEVTOOLS=true
```

---

### Production (продакшн)

**Backend `.env`:**
```bash
# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

# Database (пример Render)
DATABASE_URL=postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/travelhub_db
REDIS_URL=redis://red-xxx.oregon-redis.render.com:6379

# Security (ВАЖНО: сгенерировать новые!)
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://travelhub.com,https://www.travelhub.com

# Travelpayouts
TRAVELPAYOUTS_TOKEN=your_production_token
TRAVELPAYOUTS_MARKER=travelhub

# Email (SendGrid для production)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxx
EMAIL_FROM=TravelHub <noreply@travelhub.com>

# Stripe Production
STRIPE_PUBLIC_KEY=pk_live_51Abc...
STRIPE_SECRET_KEY=sk_live_51Abc...
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/123456
SENTRY_ENVIRONMENT=production

# Affiliate
AFFILIATE_COMMISSION_LEVEL_1=5.0
AFFILIATE_COMMISSION_LEVEL_2=2.5
AFFILIATE_COMMISSION_LEVEL_3=1.0
AFFILIATE_MIN_PAYOUT=50.00

# Misc
MAX_FILE_SIZE=10485760
ENABLE_SWAGGER=false
```

**Frontend `.env`:**
```bash
VITE_API_BASE_URL=https://api.travelhub.com/api
VITE_API_TIMEOUT=30000
VITE_ENABLE_ANALYTICS=true
VITE_GA_TRACKING_ID=UA-XXXXX-X
VITE_SENTRY_DSN=https://xxx@sentry.io/123456
VITE_ENABLE_DEVTOOLS=false
VITE_STRIPE_PUBLIC_KEY=pk_live_51Abc...
```

---

## 🔒 Безопасность

### ⚠️ НИКОГДА не коммитьте в Git:
- ❌ `.env` файлы
- ❌ Секретные ключи
- ❌ API токены
- ❌ Пароли баз данных

### ✅ Всегда коммитьте:
- ✅ `.env.example` с примерами
- ✅ Документацию по переменным

### 🛡️ Best Practices:
1. Используйте разные ключи для dev/staging/production
2. Ротируйте секреты регулярно (каждые 90 дней)
3. Используйте сервисы управления секретами (AWS Secrets Manager, HashiCorp Vault)
4. Не используйте продакшн ключи в development
5. Ограничивайте доступ к .env файлам (chmod 600)

---

## 📚 Полезные ссылки

### Получение API ключей:
- **Travelpayouts**: https://www.travelpayouts.com/
- **Stripe**: https://dashboard.stripe.com/register
- **SendGrid**: https://signup.sendgrid.com/
- **Google OAuth**: https://console.cloud.google.com/
- **AWS**: https://aws.amazon.com/console/
- **Cloudinary**: https://cloudinary.com/users/register/free

### Документация:
- **JWT**: https://jwt.io/
- **Prisma**: https://www.prisma.io/docs
- **Redis**: https://redis.io/docs
- **Vite Env**: https://vitejs.dev/guide/env-and-mode.html

---

## 🆘 Частые проблемы

### DATABASE_URL не работает
```bash
# Проверьте формат:
postgresql://[user]:[password]@[host]:[port]/[database]

# Escape специальные символы в пароле:
# Если пароль содержит @, : или /
postgresql://user:p%40ssw%3Ard@host:5432/db
```

### JWT токены не валидируются
```bash
# Убедитесь что ключи одинаковые на всех инстансах
# Проверьте время жизни токенов
# Убедитесь что часы синхронизированы (NTP)
```

### CORS ошибки
```bash
# Добавьте все фронтенд URLs в FRONTEND_URL
FRONTEND_URL=http://localhost:5173,http://localhost:3001,https://yourdomain.com
```

### Email не отправляются (Gmail)
```bash
# 1. Включите 2FA на аккаунте Google
# 2. Создайте App Password
# 3. Используйте App Password вместо обычного пароля
# 4. Проверьте SMTP_PORT (587 для TLS)
```

---

**Последнее обновление:** 2024-12-22
**Версия TravelHub:** 1.0.0
