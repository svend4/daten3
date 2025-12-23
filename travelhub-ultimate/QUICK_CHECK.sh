#!/bin/bash

# Quick CORS verification after fix
# Run this after backend redeploy completes

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              🔍 Быстрая проверка CORS                         ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

BACKEND="https://daten3-1.onrender.com"
FRONTEND="https://daten3.onrender.com"

echo "⏳ Проверяю backend..."
echo ""

# Test 1: Simple health check
echo "📋 Тест 1: Health Check"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND/api/health" 2>&1)

if [ "$response" = "200" ]; then
    echo "   ✅ Backend отвечает (200 OK)"
else
    echo "   ❌ Backend не отвечает (статус: $response)"
    echo "   ⚠️  Возможно передеплой ещё не завершён"
    exit 1
fi

echo ""
echo "📋 Тест 2: CORS Headers"

# Test 2: CORS check
response=$(curl -i -s \
  "$BACKEND/api/health" \
  -H "Origin: $FRONTEND" 2>&1)

if echo "$response" | grep -qi "access-control-allow-origin: $FRONTEND"; then
    echo "   ✅ CORS настроен правильно!"
    echo "   ✅ Frontend: $FRONTEND"
elif echo "$response" | grep -qi "access-control-allow-origin:"; then
    origin=$(echo "$response" | grep -i "access-control-allow-origin:" | cut -d' ' -f2 | tr -d '\r')
    echo "   ⚠️  CORS настроен, но для другого origin:"
    echo "      Получено: $origin"
    echo "      Ожидается: $FRONTEND"
    exit 1
else
    echo "   ❌ CORS НЕ настроен!"
    echo "   ❌ Переменная FRONTEND_URL не применилась"
    echo ""
    echo "   🔧 Что делать:"
    echo "   1. Проверьте что передеплой завершён (Events в Render)"
    echo "   2. Проверьте Environment → FRONTEND_URL"
    echo "   3. Попробуйте Manual Deploy"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🎉 ВСЁ РАБОТАЕТ!"
echo ""
echo "  ✅ Backend доступен"
echo "  ✅ CORS настроен правильно"
echo "  ✅ Frontend может подключаться к Backend"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Следующий шаг:"
echo "   Откройте https://daten3.onrender.com и проверьте функциональность"
echo ""
