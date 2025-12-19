# 🚀 Пункт 6: Deployment и Production Setup

## Обзор стратегии деплоя

```
Development → Staging → Production

Git Push → CI/CD Pipeline → Automated Tests → Deploy
```

## Варианты хостинга

### Рекомендуемый (простой старт)

**Frontend:**
- **Vercel** (бесплатно) - автоматический деплой из GitHub
- **Netlify** (бесплатно) - альтернатива Vercel
- **Cloudflare Pages** (бесплатно) - с их CDN

**Backend:**
- **Railway** ($5-20/месяц) - простой деплой с БД
- **Render** (бесплатно/платно) - автоматический деплой
- **Fly.io** (бесплатно/платно) - близость к пользователям

**База данных:**
- **Neon** (бесплатно) - serverless PostgreSQL
- **Supabase** (бесплатно) - PostgreSQL + auth + storage
- **PlanetScale** (бесплатно) - serverless MySQL

**Redis/Cache:**
- **Upstash** (бесплатно) - serverless Redis
- **Redis Cloud** (бесплатно) - managed Redis

### Enterprise (высокие нагрузки)

- **AWS** (EC2 + RDS + ElastiCache + CloudFront)
- **Google Cloud** (GKE + Cloud SQL + Memorystore)
- **DigitalOcean** (Droplets + Managed DB + Spaces CDN)

## 1. Docker Конфигурация

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы package
COPY package*.json ./
RUN npm ci

# Копируем исходники и собираем
COPY . .
RUN npm run build

# Production образ
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем nginx конфигурацию
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production образ
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Docker Compose для разработки

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3001:80"
    environment:
      - VITE_API_BASE_URL=http://backend:3000/api
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:password@db:5432/travelhub
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=travelhub
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 2. Kubernetes Deployment

### Frontend Deployment

```yaml
# deployment/kubernetes/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: travelhub-frontend
  labels:
    app: travelhub-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: travelhub-frontend
  template:
    metadata:
      labels:
        app: travelhub-frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/travelhub-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: travelhub-frontend
spec:
  selector:
    app: travelhub-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

### Backend Deployment

```yaml
# deployment/kubernetes/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: travelhub-backend
  labels:
    app: travelhub-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: travelhub-backend
  template:
    metadata:
      labels:
        app: travelhub-backend
    spec:
      containers:
      - name: backend
        image: your-registry/travelhub-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: travelhub-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: travelhub-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: travelhub-backend
spec:
  selector:
    app: travelhub-backend
  ports:
  - protocol: TCP
    port: 3000
    targetPort: 3000
  type: ClusterIP
```

### Ingress Configuration

```yaml
# deployment/kubernetes/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: travelhub-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - travelhub.com
    - api.travelhub.com
    secretName: travelhub-tls
  rules:
  - host: travelhub.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: travelhub-frontend
            port:
              number: 80
  - host: api.travelhub.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: travelhub-backend
            port:
              number: 3000
```

## 3. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install Frontend Dependencies
        working-directory: ./frontend
        run: npm ci
        
      - name: Test Frontend
        working-directory: ./frontend
        run: npm test
        
      - name: Lint Frontend
        working-directory: ./frontend
        run: npm run lint
        
      - name: Install Backend Dependencies
        working-directory: ./backend
        run: npm ci
        
      - name: Test Backend
        working-directory: ./backend
        run: npm test

  build-and-deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Frontend
        working-directory: ./frontend
        run: |
          npm ci
          npm run build
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'

  build-and-deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Backend
        working-directory: ./backend
        run: |
          npm ci
          npm run build
          
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: travelhub-backend
```

## 4. Nginx Configuration

```nginx
# deployment/nginx/nginx.conf
server {
    listen 80;
    server_name travelhub.com www.travelhub.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name travelhub.com www.travelhub.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/travelhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/travelhub.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Root directory
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 5. Environment Variables

### Frontend (.env.production)

```bash
VITE_API_BASE_URL=https://api.travelhub.com
VITE_API_TIMEOUT=30000
VITE_ENABLE_ANALYTICS=true
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Backend (.env.production)

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/travelhub
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://host:6379
REDIS_TTL=600

# Security
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://travelhub.com

# API Keys
BOOKING_API_KEY=your_booking_key
SKYSCANNER_API_KEY=your_skyscanner_key
AMADEUS_API_KEY=your_amadeus_key
AMADEUS_API_SECRET=your_amadeus_secret

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
LOG_LEVEL=info
```

## 6. Мониторинг и Логирование

### Sentry Integration (Frontend)

```typescript
// frontend/src/main.tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay()
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### Sentry Integration (Backend)

```typescript
// backend/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### Winston Logger Setup

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

## 7. Health Checks

```typescript
// backend/src/routes/health.ts
import express from 'express';
import { db } from '../db';
import redis from '../redis';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Check database
    await db.query('SELECT 1');
    
    // Check Redis
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        redis: 'up',
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

router.get('/ready', async (req, res) => {
  res.json({ ready: true });
});

export default router;
```

## 8. Скрипты для деплоя

```bash
# deployment/scripts/deploy.sh
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Build Frontend
echo "📦 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Build Backend
echo "📦 Building backend..."
cd backend
npm ci
npm run build
cd ..

# Run tests
echo "🧪 Running tests..."
cd frontend && npm test && cd ..
cd backend && npm test && cd ..

# Deploy
echo "🌐 Deploying..."
if [ "$1" = "vercel" ]; then
    cd frontend && vercel --prod && cd ..
elif [ "$1" = "railway" ]; then
    cd backend && railway up && cd ..
else
    echo "Please specify deployment target: vercel or railway"
    exit 1
fi

echo "✅ Deployment complete!"
```

## 9. Чек-лист перед деплоем

```markdown
### Pre-Production Checklist

#### Security
- [ ] Все секреты в environment variables
- [ ] HTTPS настроен с валидным SSL
- [ ] CORS настроен правильно
- [ ] Rate limiting включен
- [ ] Security headers установлены
- [ ] SQL injection защита
- [ ] XSS защита

#### Performance
- [ ] Gzip/Brotli compression включен
- [ ] Static assets кэшируются
- [ ] Images оптимизированы
- [ ] Code splitting настроен
- [ ] Database indices созданы
- [ ] Redis кэширование работает

#### Monitoring
- [ ] Sentry настроен
- [ ] Логирование работает
- [ ] Health checks настроены
- [ ] Uptime monitoring
- [ ] Performance monitoring

#### SEO
- [ ] Meta tags настроены
- [ ] Sitemap.xml создан
- [ ] robots.txt настроен
- [ ] Structured data добавлены
- [ ] Page speed оптимизирован

#### Backup
- [ ] Database backups автоматические
- [ ] Backup тестирован
- [ ] Disaster recovery план

#### Legal
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Cookie consent
- [ ] GDPR compliance
```

## 10. Rollback Strategy

```bash
# deployment/scripts/rollback.sh
#!/bin/bash

set -e

echo "⚠️  Starting rollback..."

# Rollback to previous version
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD^)

echo "Rolling back to version: $PREVIOUS_VERSION"

git checkout $PREVIOUS_VERSION

# Rebuild and redeploy
./deployment/scripts/deploy.sh

echo "✅ Rollback complete to $PREVIOUS_VERSION"
```

---

**Следующий документ:** [07_SEO_оптимизация.md](./07_SEO_оптимизация.md)
