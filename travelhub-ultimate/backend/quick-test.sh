#!/bin/bash

# Быстрая демонстрация всех эндпоинтов TravelHub Ultimate API
# Quick demonstration of all TravelHub Ultimate API endpoints

URL="https://daten3-travelbackend.up.railway.app"

echo "🚀 TravelHub Ultimate API - Демонстрация всех эндпоинтов"
echo "========================================================="
echo ""

# Функция для красивого вывода
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    echo "📍 $name"
    echo "   $endpoint"
    echo ""
}

# ============================================
# 1. ЗДОРОВЬЕ СИСТЕМЫ (2)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  ЗДОРОВЬЕ СИСТЕМЫ (2 эндпоинта)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "Проверка здоровья #1" "GET $URL/health"
curl -s "$URL/health" | jq '.'
echo ""

test_endpoint "Проверка здоровья #2" "GET $URL/api/health"
curl -s "$URL/api/health" | jq '.'
echo ""

# ============================================
# 2. ИНФОРМАЦИЯ ОБ API (1)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  ИНФОРМАЦИЯ ОБ API (1 эндпоинт)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "Информация об API" "GET $URL/"
curl -s "$URL/" | jq '.'
echo ""

# ============================================
# 3. ПОИСК - ПУБЛИЧНЫЕ (4)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  ПОИСК - ПУБЛИЧНЫЕ (4 эндпоинта)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "Поиск отелей (инфо)" "GET $URL/api/hotels/search"
curl -s "$URL/api/hotels/search" | jq '.'
echo ""

test_endpoint "Поиск отелей (POST)" "POST $URL/api/hotels/search"
curl -s -X POST "$URL/api/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{"destination":"Париж","checkIn":"2025-06-01","checkOut":"2025-06-05","adults":2}' | jq '.'
echo ""

test_endpoint "Поиск рейсов (инфо)" "GET $URL/api/flights/search"
curl -s "$URL/api/flights/search" | jq '.'
echo ""

test_endpoint "Поиск рейсов (POST)" "POST $URL/api/flights/search"
curl -s -X POST "$URL/api/flights/search" \
  -H "Content-Type: application/json" \
  -d '{"from":"MOW","to":"PAR","departDate":"2025-06-01","adults":1}' | jq '.'
echo ""

# ============================================
# 4. АУТЕНТИФИКАЦИЯ - ПУБЛИЧНЫЕ (7)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  АУТЕНТИФИКАЦИЯ - ПУБЛИЧНЫЕ (7 эндпоинтов)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TIMESTAMP=$(date +%s)
TEST_EMAIL="demo${TIMESTAMP}@test.com"

test_endpoint "Регистрация" "POST $URL/api/auth/register"
REGISTER_RESPONSE=$(curl -s -X POST "$URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test123!\",\"firstName\":\"Демо\",\"lastName\":\"Пользователь\"}")
echo "$REGISTER_RESPONSE" | jq '.'
echo ""

test_endpoint "Вход (Login)" "POST $URL/api/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "$URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test123!\"}")
echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# Извлечь токен
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // empty')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.refreshToken // empty')

if [ -n "$REFRESH_TOKEN" ]; then
    test_endpoint "Обновление токена" "POST $URL/api/auth/refresh"
    curl -s -X POST "$URL/api/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq '.'
    echo ""
fi

test_endpoint "Забыли пароль" "POST $URL/api/auth/forgot-password"
curl -s -X POST "$URL/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" | jq '.'
echo ""

test_endpoint "Сброс пароля" "POST $URL/api/auth/reset-password"
curl -s -X POST "$URL/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"demo-token","newPassword":"NewPass123!"}' | jq '.'
echo ""

test_endpoint "Google OAuth" "GET $URL/api/auth/google"
echo "   Перенаправляет на Google OAuth (HTTP 302)"
echo ""

test_endpoint "Google Callback" "GET $URL/api/auth/google/callback"
echo "   Обработка Google OAuth callback (HTTP 302)"
echo ""

# ============================================
# 5. АУТЕНТИФИКАЦИЯ - ЗАЩИЩЕННЫЕ (4)
# ============================================
if [ -n "$ACCESS_TOKEN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "5️⃣  АУТЕНТИФИКАЦИЯ - ЗАЩИЩЕННЫЕ (4 эндпоинта)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    test_endpoint "Получить профиль" "GET $URL/api/auth/me"
    curl -s "$URL/api/auth/me" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    test_endpoint "Обновить профиль" "PUT $URL/api/auth/me"
    curl -s -X PUT "$URL/api/auth/me" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"firstName":"Обновлено","lastName":"Имя"}' | jq '.'
    echo ""

    test_endpoint "Изменить пароль" "PUT $URL/api/auth/me/password"
    curl -s -X PUT "$URL/api/auth/me/password" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"currentPassword":"Test123!","newPassword":"NewTest456!"}' | jq '.'
    echo ""

    test_endpoint "Удалить аккаунт" "DELETE $URL/api/auth/me"
    echo "   (Пропущено для сохранения тестового аккаунта)"
    echo ""
fi

# ============================================
# 6. БРОНИРОВАНИЯ (5)
# ============================================
if [ -n "$ACCESS_TOKEN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "6️⃣  БРОНИРОВАНИЯ (5 эндпоинтов)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    test_endpoint "Получить все бронирования" "GET $URL/api/bookings"
    curl -s "$URL/api/bookings" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    test_endpoint "Создать бронирование" "POST $URL/api/bookings"
    BOOKING_RESPONSE=$(curl -s -X POST "$URL/api/bookings" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"type":"hotel","itemId":"hotel_123","checkIn":"2025-06-01","checkOut":"2025-06-05","totalPrice":15000}')
    echo "$BOOKING_RESPONSE" | jq '.'
    BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.data.id // empty')
    echo ""

    if [ -n "$BOOKING_ID" ]; then
        test_endpoint "Получить одно бронирование" "GET $URL/api/bookings/$BOOKING_ID"
        curl -s "$URL/api/bookings/$BOOKING_ID" \
          -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
        echo ""

        test_endpoint "Обновить статус" "PATCH $URL/api/bookings/$BOOKING_ID/status"
        curl -s -X PATCH "$URL/api/bookings/$BOOKING_ID/status" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"status":"confirmed"}' | jq '.'
        echo ""

        test_endpoint "Отменить бронирование" "DELETE $URL/api/bookings/$BOOKING_ID"
        curl -s -X DELETE "$URL/api/bookings/$BOOKING_ID" \
          -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
        echo ""
    fi
fi

# ============================================
# 7. ИЗБРАННОЕ (4)
# ============================================
if [ -n "$ACCESS_TOKEN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "7️⃣  ИЗБРАННОЕ (4 эндпоинта)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    test_endpoint "Получить избранное" "GET $URL/api/favorites"
    curl -s "$URL/api/favorites" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    test_endpoint "Добавить в избранное" "POST $URL/api/favorites"
    FAV_RESPONSE=$(curl -s -X POST "$URL/api/favorites" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"type":"hotel","itemId":"hotel_789","name":"Парижский отель","location":"Париж"}')
    echo "$FAV_RESPONSE" | jq '.'
    FAV_ID=$(echo "$FAV_RESPONSE" | jq -r '.data.id // empty')
    echo ""

    test_endpoint "Проверить избранное" "GET $URL/api/favorites/check/hotel/hotel_789"
    curl -s "$URL/api/favorites/check/hotel/hotel_789" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    if [ -n "$FAV_ID" ]; then
        test_endpoint "Удалить из избранного" "DELETE $URL/api/favorites/$FAV_ID"
        curl -s -X DELETE "$URL/api/favorites/$FAV_ID" \
          -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
        echo ""
    fi
fi

# ============================================
# 8. ЦЕНОВЫЕ УВЕДОМЛЕНИЯ (4)
# ============================================
if [ -n "$ACCESS_TOKEN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "8️⃣  ЦЕНОВЫЕ УВЕДОМЛЕНИЯ (4 эндпоинта) - В РАЗРАБОТКЕ"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    test_endpoint "Получить уведомления" "GET $URL/api/price-alerts"
    curl -s "$URL/api/price-alerts" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    echo "   (Остальные 3 эндпоинта также возвращают HTTP 501)"
    echo ""
fi

# ============================================
# 9. ПАРТНЕРСКАЯ ПРОГРАММА (13)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  ПАРТНЕРСКАЯ ПРОГРАММА (13 эндпоинтов)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "Дашборд партнера" "GET $URL/api/affiliate/dashboard"
curl -s "$URL/api/affiliate/dashboard" | jq '.'
echo ""

test_endpoint "Дерево рефералов" "GET $URL/api/affiliate/referral-tree"
curl -s "$URL/api/affiliate/referral-tree" | jq '.'
echo ""

test_endpoint "Статистика партнера" "GET $URL/api/affiliate/stats"
curl -s "$URL/api/affiliate/stats" | jq '.'
echo ""

test_endpoint "Регистрация партнера" "POST $URL/api/affiliate/register"
curl -s -X POST "$URL/api/affiliate/register" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123"}' | jq '.'
echo ""

test_endpoint "Проверка кода" "GET $URL/api/affiliate/validate/REF123456"
curl -s "$URL/api/affiliate/validate/REF123456" | jq '.'
echo ""

test_endpoint "Заработок" "GET $URL/api/affiliate/earnings"
curl -s "$URL/api/affiliate/earnings" | jq '.'
echo ""

test_endpoint "Список рефералов" "GET $URL/api/affiliate/referrals"
curl -s "$URL/api/affiliate/referrals" | jq '.'
echo ""

test_endpoint "История выплат" "GET $URL/api/affiliate/payouts"
curl -s "$URL/api/affiliate/payouts" | jq '.'
echo ""

test_endpoint "Запрос выплаты" "POST $URL/api/affiliate/payouts/request"
curl -s -X POST "$URL/api/affiliate/payouts/request" \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"method":"bank_transfer"}' | jq '.'
echo ""

test_endpoint "Партнерские ссылки" "GET $URL/api/affiliate/links"
curl -s "$URL/api/affiliate/links" | jq '.'
echo ""

test_endpoint "Отслеживание клика" "POST $URL/api/affiliate/track-click"
curl -s -X POST "$URL/api/affiliate/track-click" \
  -H "Content-Type: application/json" \
  -d '{"referralCode":"REF123456","source":"email"}' | jq '.'
echo ""

test_endpoint "Настройки партнера" "GET $URL/api/affiliate/settings"
curl -s "$URL/api/affiliate/settings" | jq '.'
echo ""

test_endpoint "Обновить настройки" "PUT $URL/api/affiliate/settings"
curl -s -X PUT "$URL/api/affiliate/settings" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"paypal"}' | jq '.'
echo ""

# ============================================
# 10. АДМИН ПАНЕЛЬ (14)
# ============================================
if [ -n "$ACCESS_TOKEN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔟 АДМИН ПАНЕЛЬ (14 эндпоинтов) - ТРЕБУЕТСЯ РОЛЬ ADMIN"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    test_endpoint "Список партнеров" "GET $URL/api/admin/affiliates"
    curl -s "$URL/api/admin/affiliates" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    test_endpoint "Настройки программы" "GET $URL/api/admin/settings"
    curl -s "$URL/api/admin/settings" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    test_endpoint "Аналитика" "GET $URL/api/admin/analytics"
    curl -s "$URL/api/admin/analytics" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    test_endpoint "Топ партнеров" "GET $URL/api/admin/analytics/top-performers"
    curl -s "$URL/api/admin/analytics/top-performers" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    echo "   (Остальные 10 admin эндпоинтов требуют роль администратора)"
    echo ""
fi

# ============================================
# ИТОГИ
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ИТОГИ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Всего категорий эндпоинтов: 10"
echo "Всего эндпоинтов: 56"
echo ""
echo "  1️⃣  Здоровье системы: 2"
echo "  2️⃣  Информация API: 1"
echo "  3️⃣  Поиск (публичные): 4"
echo "  4️⃣  Аутентификация (публичные): 7"
echo "  5️⃣  Аутентификация (защищенные): 4"
echo "  6️⃣  Бронирования: 5"
echo "  7️⃣  Избранное: 4"
echo "  8️⃣  Ценовые уведомления: 4 (в разработке)"
echo "  9️⃣  Партнерская программа: 13"
echo "  🔟 Админ панель: 14"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Демонстрация завершена!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
