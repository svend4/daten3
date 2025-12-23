#!/bin/bash

# CORS Check Script for Production
# Tests if backend accepts requests from frontend

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              🔍 CORS Production Check                         ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

BACKEND_URL="https://daten3-1.onrender.com"
FRONTEND_URL="https://daten3.onrender.com"

echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 1: Preflight Request (OPTIONS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

response=$(curl -i -s -X OPTIONS \
  "${BACKEND_URL}/api/health" \
  -H "Origin: ${FRONTEND_URL}" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  2>&1)

if echo "$response" | grep -q "access-control-allow-origin: ${FRONTEND_URL}"; then
    echo "✅ CORS allowed for ${FRONTEND_URL}"
elif echo "$response" | grep -q "access-control-allow-origin:"; then
    origin=$(echo "$response" | grep -i "access-control-allow-origin:" | cut -d' ' -f2 | tr -d '\r')
    echo "⚠️  CORS разрешён, но для другого origin: $origin"
    echo "   Ожидался: ${FRONTEND_URL}"
else
    echo "❌ CORS НЕ разрешён!"
    echo "   Backend не возвращает Access-Control-Allow-Origin"
    echo ""
    echo "   🔧 РЕШЕНИЕ:"
    echo "   1. Откройте Render Dashboard"
    echo "   2. Backend Service → Environment"
    echo "   3. Добавьте: FRONTEND_URL = ${FRONTEND_URL}"
    echo "   4. Сохраните и дождитесь передеплоя"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 2: Actual Request (GET)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

response=$(curl -i -s \
  "${BACKEND_URL}/api/health" \
  -H "Origin: ${FRONTEND_URL}" \
  2>&1)

if echo "$response" | grep -q "HTTP/.* 200"; then
    echo "✅ Backend отвечает (200 OK)"
else
    status=$(echo "$response" | grep "HTTP/" | head -1)
    echo "⚠️  Backend ответил: $status"
fi

if echo "$response" | grep -q "access-control-allow-credentials: true"; then
    echo "✅ Credentials разрешены"
else
    echo "⚠️  Credentials не разрешены (может быть проблемой для cookies)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if echo "$response" | grep -q "access-control-allow-origin: ${FRONTEND_URL}"; then
    echo ""
    echo "  ✅ CORS настроен правильно!"
    echo "  ✅ Frontend может подключаться к Backend"
    echo ""
else
    echo ""
    echo "  ❌ CORS НЕ настроен или настроен неправильно!"
    echo "  ❌ Frontend НЕ МОЖЕТ подключиться к Backend"
    echo ""
    echo "  📝 Следуйте инструкциям в QUICK_FIX_CORS.md"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
