# TravelHub Ultimate - Enterprise Travel Booking Platform

> Production-ready travel booking platform with 70+ enterprise features, REST + GraphQL APIs, multi-tenancy, real-time capabilities, and comprehensive observability.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748.svg)](https://www.prisma.io/)
[![GraphQL](https://img.shields.io/badge/GraphQL-16.x-E10098.svg)](https://graphql.org/)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev

# Access APIs
# REST API: http://localhost:3000/api
# GraphQL API: http://localhost:3000/graphql
# Swagger Docs: http://localhost:3000/api-docs
# Health Dashboard: http://localhost:3000/api/health/dashboard
```

## ✨ Features (70+)

### Core Business
- ✅ Flight/Hotel/Car Booking
- ✅ User Management & Auth
- ✅ Affiliate & Commission System
- ✅ Reviews & Ratings
- ✅ Loyalty Program
- ✅ Price Alerts

### Enterprise Architecture
- ✅ **REST API** - Full REST API with Swagger
- ✅ **GraphQL API** - Apollo Server 5
- ✅ **Multi-tenancy** - B2B white-label support
- ✅ **Real-time** - WebSocket + SSE
- ✅ **Message Queue** - BullMQ async processing
- ✅ **Background Jobs** - Scheduled tasks

### Security & Performance
- ✅ API Versioning (v1/v2/v3)
- ✅ Input Sanitization (XSS/SQL protection)
- ✅ Rate Limiting (Tiered by plan)
- ✅ Circuit Breaker (Service protection)
- ✅ Advanced Caching (Redis)
- ✅ CDN Integration (CloudFlare/AWS)
- ✅ Content Security Policy
- ✅ Request Deduplication

### Monitoring & Observability
- ✅ Distributed Tracing
- ✅ Audit Logging
- ✅ Performance Metrics
- ✅ Health Checks (Basic/Detailed/Advanced)
- ✅ Error Tracking
- ✅ 30+ Metric Categories

### Internationalization
- ✅ i18n Support (7 languages)
- ✅ Currency Conversion
- ✅ Timezone Handling

[See full feature list in docs]

## 🏗️ Technology Stack

- **Runtime:** Node.js 20+, TypeScript 5.0
- **Framework:** Express 4.x
- **Database:** PostgreSQL 14+ (Prisma ORM)
- **Cache/Queue:** Redis 6+, BullMQ
- **GraphQL:** Apollo Server 5
- **Real-time:** Socket.IO, SSE
- **Payments:** Stripe
- **APIs:** Travelpayouts

## 📚 API Documentation

### REST API

```bash
# Health Checks
GET  /api/health                    # Basic health
GET  /api/health/dashboard          # All metrics

# Authentication
POST /api/auth/register             # Register
POST /api/auth/login                # Login
POST /api/auth/refresh              # Refresh token

# Bookings
GET    /api/bookings                # List
POST   /api/bookings                # Create
GET    /api/bookings/:id            # Get
PATCH  /api/bookings/:id            # Update
DELETE /api/bookings/:id            # Cancel

# Multi-tenancy
GET  /api/tenants/current           # Current tenant
GET  /api/tenants                   # List (admin)
POST /api/tenants                   # Create (admin)
```

### GraphQL API

**Endpoint:** `http://localhost:3000/graphql`

```graphql
# Get current user with bookings
query {
  me {
    id
    email
    bookings(limit: 10) {
      id
      type
      status
      totalPrice
    }
  }
}

# Create booking
mutation {
  createBooking(input: {
    type: FLIGHT
    totalPrice: 599.99
    details: { route: "NYC-LAX" }
  }) {
    id
    status
  }
}
```

## 🔧 Configuration

Create `.env` file:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/travelhub"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# Multi-tenancy
TENANT_STRATEGY=header          # subdomain|header|jwt|query
TENANT_REQUIRED=false

# CDN & Security
CDN_ENABLED=false
CDN_PROVIDER=cloudflare
CSP_ENABLED=true
```

## 💻 Development

```bash
# Install
npm install

# Database
npx prisma generate
npx prisma migrate dev

# Run
npm run dev          # Development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
```

## 📦 Deployment

### Docker

```bash
docker build -t travelhub-backend .
docker run -p 3000:3000 travelhub-backend
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: travelhub-backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: travelhub-backend:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/health/liveness
            port: 3000
        readinessProbe:
          httpGet:
            path: /api/health/readiness
            port: 3000
```

## 📊 Monitoring

Access comprehensive metrics at:
- `/api/health/dashboard` - All metrics
- `/api/health/detailed` - Dependency status
- `/graphql` - GraphQL operations

**30+ Metric Categories:**
- Performance, Errors, Response Times
- Database, Cache, Queue statistics
- WebSocket/SSE connections
- Multi-tenancy, GraphQL ops
- And more...

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

## 📄 License

MIT License

## 🙏 Acknowledgments

- Innovation Library
- Travelpayouts API
- Apollo GraphQL
- Prisma ORM

---

**Built with ❤️ using TypeScript, Node.js, and Enterprise Best Practices**

**TravelHub Ultimate** - Complete enterprise travel booking platform ready for production deployment.
