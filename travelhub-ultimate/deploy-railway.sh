#!/bin/bash

# 🚂 TravelHub Railway Deployment Script
# Автоматический деплой на Railway с проверками

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ASCII art banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║   TravelHub Railway Deployment        ║
║   🚂 Deploy to Production             ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# Проверка установки Railway CLI
print_info "Проверка Railway CLI..."
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI не установлен!"
    print_info "Установите Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo "  или"
    echo "  brew install railway"
    exit 1
fi
print_success "Railway CLI установлен"

# Проверка авторизации в Railway
print_info "Проверка авторизации Railway..."
if ! railway whoami &> /dev/null; then
    print_warning "Вы не авторизованы в Railway"
    print_info "Запускаю авторизацию..."
    railway login
fi
print_success "Авторизация успешна: $(railway whoami)"

# Проверка, что мы в правильной директории
print_info "Проверка директории проекта..."
if [ ! -f "railway.toml" ]; then
    print_error "Не найден файл railway.toml"
    print_info "Убедитесь, что вы находитесь в директории travelhub-ultimate/"
    exit 1
fi
print_success "Директория проекта корректна"

# Проверка git репозитория
print_info "Проверка git репозитория..."
if [ ! -d ".git" ]; then
    print_error "Это не git репозиторий!"
    exit 1
fi
print_success "Git репозиторий найден"

# Проверка uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "У вас есть uncommitted изменения!"
    read -p "Хотите сделать commit? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Введите commit message: " commit_msg
        git commit -m "$commit_msg"
        print_success "Изменения закоммичены"
    fi
fi

# Меню выбора типа деплоя
echo ""
print_info "Выберите тип деплоя:"
echo "  1) Backend + PostgreSQL + Redis (рекомендуется для начала)"
echo "  2) Только Backend"
echo "  3) Backend + Frontend"
echo "  4) Полный стек (Backend + Frontend + PostgreSQL + Redis)"
echo ""
read -p "Выберите вариант (1-4): " -n 1 -r deploy_type
echo ""

case $deploy_type in
    1)
        print_info "Деплой: Backend + PostgreSQL + Redis"
        DEPLOY_BACKEND=true
        DEPLOY_FRONTEND=false
        DEPLOY_POSTGRES=true
        DEPLOY_REDIS=true
        ;;
    2)
        print_info "Деплой: Только Backend"
        DEPLOY_BACKEND=true
        DEPLOY_FRONTEND=false
        DEPLOY_POSTGRES=false
        DEPLOY_REDIS=false
        ;;
    3)
        print_info "Деплой: Backend + Frontend"
        DEPLOY_BACKEND=true
        DEPLOY_FRONTEND=true
        DEPLOY_POSTGRES=false
        DEPLOY_REDIS=false
        ;;
    4)
        print_info "Деплой: Полный стек"
        DEPLOY_BACKEND=true
        DEPLOY_FRONTEND=true
        DEPLOY_POSTGRES=true
        DEPLOY_REDIS=true
        ;;
    *)
        print_error "Неверный выбор"
        exit 1
        ;;
esac

# Проверка существования проекта Railway
print_info "Проверка Railway проекта..."
if railway status &> /dev/null; then
    PROJECT_NAME=$(railway status | grep "Project:" | awk '{print $2}')
    print_success "Проект найден: $PROJECT_NAME"
else
    print_warning "Railway проект не найден"
    read -p "Создать новый проект? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Создание нового проекта..."
        railway init
        print_success "Проект создан"
    else
        print_error "Деплой отменен"
        exit 1
    fi
fi

# Деплой PostgreSQL
if [ "$DEPLOY_POSTGRES" = true ]; then
    print_info "Добавление PostgreSQL..."
    railway add --database postgres || print_warning "PostgreSQL уже добавлен или ошибка"
    print_success "PostgreSQL готов"
fi

# Деплой Redis
if [ "$DEPLOY_REDIS" = true ]; then
    print_info "Добавление Redis..."
    railway add --database redis || print_warning "Redis уже добавлен или ошибка"
    print_success "Redis готов"
fi

# Деплой Backend
if [ "$DEPLOY_BACKEND" = true ]; then
    print_info "Деплой Backend..."

    # Проверка package.json
    if [ ! -f "backend/package.json" ]; then
        print_error "backend/package.json не найден!"
        exit 1
    fi

    # Проверка Dockerfile
    if [ ! -f "backend/Dockerfile" ]; then
        print_error "backend/Dockerfile не найден!"
        exit 1
    fi

    # Сборка и деплой
    print_info "Загрузка backend на Railway..."
    railway up --service backend

    print_success "Backend задеплоен"

    # Получение URL backend
    BACKEND_URL=$(railway domain --service backend 2>/dev/null || echo "URL будет доступен после первого деплоя")
    print_info "Backend URL: $BACKEND_URL"
fi

# Деплой Frontend
if [ "$DEPLOY_FRONTEND" = true ]; then
    print_info "Деплой Frontend..."

    # Проверка package.json
    if [ ! -f "frontend/package.json" ]; then
        print_error "frontend/package.json не найден!"
        exit 1
    fi

    # Проверка Dockerfile
    if [ ! -f "frontend/Dockerfile" ]; then
        print_error "frontend/Dockerfile не найден!"
        exit 1
    fi

    # Сборка и деплой
    print_info "Загрузка frontend на Railway..."
    railway up --service frontend

    print_success "Frontend задеплоен"

    # Получение URL frontend
    FRONTEND_URL=$(railway domain --service frontend 2>/dev/null || echo "URL будет доступен после первого деплоя")
    print_info "Frontend URL: $FRONTEND_URL"
fi

# Настройка переменных окружения
print_info "Проверка переменных окружения..."
echo ""
print_warning "ВАЖНО! Настройте следующие переменные в Railway UI:"
echo ""
echo "Backend Variables:"
echo "  NODE_ENV=production"
echo "  PORT=3000"
echo "  JWT_SECRET=<сгенерируйте безопасный ключ>"
echo "  BOOKING_API_KEY=<ваш ключ>"
echo "  SKYSCANNER_API_KEY=<ваш ключ>"
echo "  AMADEUS_API_KEY=<ваш ключ>"
echo ""

if [ "$DEPLOY_FRONTEND" = true ]; then
    echo "Frontend Variables:"
    echo "  VITE_API_BASE_URL=$BACKEND_URL/api"
    echo ""
fi

print_info "Генерация JWT_SECRET:"
echo "  Опция 1: openssl rand -base64 32"
echo "  Опция 2: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""

# Запуск миграций
if [ "$DEPLOY_POSTGRES" = true ] && [ "$DEPLOY_BACKEND" = true ]; then
    print_info "Хотите запустить миграции базы данных?"
    read -p "Запустить миграции? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Запуск миграций..."
        railway run --service backend npm run migrate:deploy || print_warning "Миграции завершились с ошибкой или уже выполнены"
        print_success "Миграции завершены"
    fi
fi

# Проверка деплоя
print_info "Проверка статуса деплоя..."
railway status

# Открыть логи
echo ""
print_info "Хотите посмотреть логи деплоя?"
read -p "Показать логи? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Логи backend (Ctrl+C для выхода):"
    railway logs --service backend
fi

# Финальное сообщение
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║   ✅ Деплой завершен успешно!         ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

print_info "Следующие шаги:"
echo "  1. Откройте Railway Dashboard: https://railway.app/dashboard"
echo "  2. Настройте переменные окружения (Variables)"
echo "  3. Добавьте кастомный домен (Settings → Domains)"
echo "  4. Настройте health check (Settings → Deploy)"
echo "  5. Проверьте логи (Deployments → Logs)"
echo ""

if [ "$DEPLOY_BACKEND" = true ]; then
    print_info "Backend команды:"
    echo "  Логи:         railway logs --service backend"
    echo "  Shell:        railway shell --service backend"
    echo "  Рестарт:      railway restart --service backend"
    echo "  Variables:    railway variables --service backend"
    echo ""
fi

if [ "$DEPLOY_FRONTEND" = true ]; then
    print_info "Frontend команды:"
    echo "  Логи:         railway logs --service frontend"
    echo "  Рестарт:      railway restart --service frontend"
    echo ""
fi

print_info "Полезные команды:"
echo "  Статус:       railway status"
echo "  Открыть UI:   railway open"
echo "  Все логи:     railway logs"
echo "  Помощь:       railway --help"
echo ""

print_success "Готово! 🎉"
print_info "Подробная инструкция: RAILWAY_DEPLOYMENT.md"
