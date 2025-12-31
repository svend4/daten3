# Настройка HTTPS для TravelHub в Coolify

## Метод 1: Автоматический SSL (Let's Encrypt) через Coolify

### Шаг 1: Настройка DNS
1. Зайдите в панель управления вашего DNS провайдера (например, Cloudflare, GoDaddy, Namecheap)
2. Создайте A-запись:
   ```
   Тип: A
   Имя: travelhub (или @, если хотите использовать корневой домен)
   Значение: 46.224.186.51
   TTL: Auto (или 300)
   ```

### Шаг 2: Настройка в Coolify

#### Для Frontend (порт 3001):
1. Откройте ваш Frontend Service в Coolify
2. Перейдите в "Settings" → "Domains"
3. Замените текущий URL на:
   ```
   travelhub.yourdomain.com
   ```
4. Включите настройки:
   - ✅ Generate SSL Certificate (Let's Encrypt)
   - ✅ Force HTTPS
   - ✅ Auto-renew certificate
5. Сохраните и переразверните

#### Для Backend (порт 3000):
1. Откройте ваш Backend Service в Coolify
2. Перейдите в "Settings" → "Domains"
3. Настройте поддомен:
   ```
   api.travelhub.yourdomain.com
   ```
4. Включите SSL:
   - ✅ Generate SSL Certificate
   - ✅ Force HTTPS
5. Сохраните

### Шаг 3: Обновите переменные окружения

**В Coolify Environment Variables:**

Frontend:
```bash
VITE_API_BASE_URL=https://api.travelhub.yourdomain.com/api
```

Backend:
```bash
FRONTEND_URL=https://travelhub.yourdomain.com
CORS_ORIGIN=https://travelhub.yourdomain.com
```

### Шаг 4: Переразверните

1. Сохраните все изменения
2. Нажмите "Redeploy" для обоих сервисов
3. Coolify автоматически:
   - Запросит SSL сертификаты
   - Настроит HTTPS
   - Включит редирект HTTP → HTTPS

---

## Метод 2: Использование Cloudflare (если домен там)

### Преимущества:
- Бесплатный SSL
- DDoS защита
- CDN кеширование
- Web Application Firewall (WAF)

### Настройка:

1. **Добавьте домен в Cloudflare:**
   - Site → Add site → введите ваш домен
   - Выберите Free план
   - Обновите nameservers у регистратора

2. **Настройте DNS в Cloudflare:**
   ```
   Тип: A
   Имя: travelhub
   IPv4: 46.224.186.51
   Proxy status: ✅ Proxied (оранжевое облако)

   Тип: A
   Имя: api.travelhub
   IPv4: 46.224.186.51
   Proxy status: ✅ Proxied
   ```

3. **Настройте SSL/TLS в Cloudflare:**
   - SSL/TLS → Overview
   - Encryption mode: **Full (strict)** или **Flexible**
   - Always Use HTTPS: **On**
   - Automatic HTTPS Rewrites: **On**

4. **В Coolify настройте домены:**
   - Frontend: `travelhub.yourdomain.com`
   - Backend: `api.travelhub.yourdomain.com`
   - SSL в Coolify: можно отключить (Cloudflare обрабатывает)

---

## Метод 3: Кастомные SSL сертификаты

Если у вас есть купленные сертификаты:

1. **В Coolify перейдите в:**
   Settings → SSL Certificates → Add Custom Certificate

2. **Загрузите:**
   - Certificate (`.crt`)
   - Private Key (`.key`)
   - Certificate Chain (`.ca-bundle`)

3. **Примените к сервисам**

---

## Проверка после настройки

### Тест SSL:
```bash
# Проверка SSL сертификата
curl -I https://travelhub.yourdomain.com

# Проверка редиректа HTTP → HTTPS
curl -I http://travelhub.yourdomain.com
```

### Онлайн инструменты:
- SSL Labs Test: https://www.ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com/

### Проверка в браузере:
1. Откройте https://travelhub.yourdomain.com
2. Кликните на замок 🔒 в адресной строке
3. Проверьте сертификат:
   - Выдан: Let's Encrypt (или ваш CA)
   - Валиден до: должна быть дата в будущем
   - Домен совпадает

---

## Устранение проблем

### Ошибка: "Certificate has expired"
- Coolify должен обновлять автоматически
- Перейдите в Settings → SSL → Renew Certificate

### Ошибка: "NET::ERR_CERT_COMMON_NAME_INVALID"
- Проверьте, что домен в DNS указывает на правильный IP
- Убедитесь, что FQDN в Coolify совпадает с доменом

### Ошибка: "Mixed Content" (страница не загружается полностью)
- Проверьте VITE_API_BASE_URL использует `https://`
- Проверьте, что все ресурсы загружаются через HTTPS

### Ошибка: "This site can't provide a secure connection"
- Проверьте, что SSL сертификат успешно выпущен
- Проверьте логи Coolify: Dashboard → Application → Logs

---

## Автоматическое обновление сертификатов

Let's Encrypt сертификаты действительны 90 дней.

**Coolify автоматически:**
- Проверяет сертификаты каждые 30 дней
- Обновляет за 30 дней до истечения
- Перезагружает Nginx с новым сертификатом

**Мониторинг:**
- Dashboard → Application → SSL Status
- Получайте уведомления об истечении

---

## Рекомендации по безопасности

После настройки HTTPS:

1. **Включите HSTS:**
   - Coolify → Settings → Security Headers
   - Strict-Transport-Security: `max-age=31536000; includeSubDomains`

2. **Настройте CSP:**
   - Уже есть в вашем backend: `src/middleware/csp.middleware.ts`

3. **Отключите незащищенный HTTP:**
   - Coolify → Force HTTPS redirect

4. **Настройте безопасные cookies:**
   ```typescript
   // backend/src/config/index.ts
   cookie: {
     secure: true,  // только HTTPS
     sameSite: 'strict',
     httpOnly: true
   }
   ```

---

## Полезные команды

```bash
# Проверка DNS
dig travelhub.yourdomain.com
nslookup travelhub.yourdomain.com

# Проверка сертификата
openssl s_client -connect travelhub.yourdomain.com:443 -servername travelhub.yourdomain.com

# Проверка истечения сертификата
echo | openssl s_client -servername travelhub.yourdomain.com -connect travelhub.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Итоговая конфигурация

После настройки у вас будет:

- ✅ `https://travelhub.yourdomain.com` - Frontend (порт 443)
- ✅ `https://api.travelhub.yourdomain.com` - Backend API (порт 443)
- ✅ Автоматические SSL сертификаты от Let's Encrypt
- ✅ Редирект HTTP → HTTPS
- ✅ Автообновление сертификатов каждые 60 дней
- ✅ A+ рейтинг на SSL Labs

Готово! 🎉
