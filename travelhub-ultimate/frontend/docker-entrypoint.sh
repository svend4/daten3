#!/bin/sh
set -e

# Railway provides PORT, default to 8080 if not set
export PORT=${PORT:-8080}

echo "=== TravelHub Frontend Starting ==="
echo "PORT: $PORT"
echo "Updating nginx configuration..."

# Update nginx to listen on Railway's PORT
sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/default.conf

echo "Nginx configuration updated"
echo "Starting nginx..."

# Start nginx in foreground
exec nginx -g 'daemon off;'
