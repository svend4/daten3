# Установить PM2
npm install -g pm2

# Запустить приложение
pm2 start ecosystem.config.js --env production

# Проверить статус
pm2 status

# Логи
pm2 logs travelhub-api

# Мониторинг
pm2 monit

# Перезапустить
pm2 restart travelhub-api

# Остановить
pm2 stop travelhub-api

# Удалить
pm2 delete travelhub-api

# Сохранить конфигурацию (автозапуск при reboot)
pm2 save
pm2 startup
