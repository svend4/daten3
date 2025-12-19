FROM node:18-alpine

# Рабочая директория
WORKDIR /app

# Копировать package files
COPY package*.json ./

# Установить зависимости
RUN npm ci --only=production

# Копировать исходный код
COPY src/ ./src/

# Создать директорию для логов
RUN mkdir -p logs

# Открыть порт
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Запустить приложение
CMD ["node", "src/app.js"]
