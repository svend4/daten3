# 🚀 TravelHub Ultimate - Quick Start Guide

## Быстрый старт для разработки

Это руководство поможет вам быстро запустить проект TravelHub Ultimate в режиме разработки.

---

## 📋 Предварительные требования

Убедитесь, что установлены:

- **Node.js** (v18+)
- **npm** или **yarn**
- **PostgreSQL** (v14+)
- **Redis** (опционально, для production CSRF)

---

## ⚡ Быстрый запуск

### 1. Клонирование репозитория

\`\`\`bash
git clone <repository-url>
cd daten3/travelhub-ultimate
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env

# Отредактируйте .env файл
nano .env
\`\`\`

#### Минимальная конфигурация .env:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/travelhub"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Node Environment
NODE_ENV=development

# Server
PORT=3000

# Redis (опционально для dev)
# REDIS_URL="redis://localhost:6379"

# Frontend URL (для CORS)
FRONTEND_URL="http://localhost:5173"
\`\`\`

#### Запуск backend:

\`\`\`bash
npm run dev
\`\`\`

Backend будет доступен на: **http://localhost:3000**

### 3. Frontend Setup

\`\`\`bash
cd frontend

# Установка зависимостей
npm install

# Настройка окружения
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env

# Запуск frontend
npm run dev
\`\`\`

Frontend будет доступен на: **http://localhost:5173**

---

## ✅ Проверка работоспособности

### 1. Откройте браузер

Перейдите на **http://localhost:5173**

### 2. Регистрация

1. Нажмите "Register" или перейдите на \`/register\`
2. Заполните форму
3. Нажмите "Зарегистрироваться"

### 3. Проверьте функционал

- Dashboard: \`/dashboard\`
- Profile: \`/profile\`
- Bookings: \`/bookings\`
- Favorites: \`/favorites\`
- Price Alerts: \`/price-alerts\`
- Settings: \`/settings\`

---

**Последнее обновление:** 22 декабря 2025

**Готовы начать? Удачи! 🚀**
