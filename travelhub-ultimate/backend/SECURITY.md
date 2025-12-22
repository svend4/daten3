# Security Implementation Guide

## Overview

TravelHub Ultimate implements multiple layers of security to protect against common web vulnerabilities (OWASP Top 10).

## Authentication & Session Management

### HttpOnly Cookies for JWT Tokens

**Implementation Date:** 2025-12-22

We use httpOnly cookies for storing JWT tokens instead of localStorage or sessionStorage to prevent XSS attacks.

#### How It Works

1. **Token Storage:**
   - Access Token: Stored in httpOnly cookie (`accessToken`)
   - Refresh Token: Stored in httpOnly cookie (`refreshToken`)
   - Both cookies are inaccessible to JavaScript

2. **Cookie Configuration:**
   ```typescript
   {
     httpOnly: true,              // Prevents JavaScript access
     secure: true,                // HTTPS only (production)
     sameSite: 'strict',          // CSRF protection
     maxAge: 15 * 60 * 1000      // 15 minutes (access token)
   }
   ```

3. **Backward Compatibility:**
   - Still supports `Authorization: Bearer <token>` header for API clients
   - Cookie-based auth is preferred for web browsers

#### Endpoints

- `POST /api/auth/register` - Sets httpOnly cookies
- `POST /api/auth/login` - Sets httpOnly cookies
- `POST /api/auth/refresh` - Refreshes tokens via cookies
- `POST /api/auth/logout` - Clears cookies and invalidates refresh token

### Refresh Token Rotation

**Implementation:** Database-backed refresh tokens with automatic expiration

- Refresh tokens stored in PostgreSQL database
- Automatic cleanup of expired tokens
- One-time use tokens (token rotation on refresh)
- 7-day expiration for refresh tokens

## CSRF Protection

### Redis-Backed CSRF Tokens

**Implementation Date:** 2025-12-22

We implement CSRF protection using tokens stored in Redis with automatic expiration.

#### Architecture

1. **Token Generation:**
   ```typescript
   // Client requests CSRF token
   GET /api/auth/csrf-token

   // Server generates and stores in Redis
   {
     "success": true,
     "data": {
       "csrfToken": "random-64-char-hex-string"
     }
   }
   ```

2. **Token Validation:**
   - Required for all state-changing operations (POST, PUT, PATCH, DELETE)
   - Token sent via `X-CSRF-Token` header or request body
   - Server validates against Redis storage

3. **Fallback Strategy:**
   - Primary: Redis storage with TTL (24 hours)
   - Fallback: In-memory storage (development mode)

#### Protected Routes

All routes except GET, HEAD, OPTIONS are protected by CSRF middleware:

```typescript
import { csrfProtection } from '../middleware/csrf.middleware.js';

router.post('/sensitive-action', csrfProtection, handler);
```

#### Session Identification

- **Authenticated Users:** User ID from JWT
- **Anonymous Users:** Hash of IP + User-Agent

## CORS Configuration

**Strict CORS policy** to prevent unauthorized cross-origin requests:

```typescript
{
  origin: process.env.FRONTEND_URL,  // Whitelist frontend URLs
  credentials: true,                  // Allow cookies
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token'
  ]
}
```

### Development vs Production

- **Development:** Allows localhost origins
- **Production:** Strict whitelist only

## Rate Limiting

### Multi-Tier Rate Limiting

1. **Global Rate Limiter:** IP-based
2. **Per-Endpoint Rate Limiter:** Custom limits per endpoint
3. **Per-User Rate Limiter:** User-specific limits

#### Rate Limit Tiers

| Tier | Requests | Window | Use Case |
|------|----------|--------|----------|
| Strict | 10 | 15 min | Login, Register |
| Moderate | 100 | 15 min | Search, API calls |
| Lenient | 200 | 15 min | General endpoints |
| Very Lenient | 500 | 15 min | Public data |

### Email-Specific Rate Limits

- **Email Verification:** 3 requests per hour
- **Password Reset:** 3 requests per hour

## Redis Integration

### Purpose

1. **CSRF Token Storage:** Distributed storage with TTL
2. **Cache:** Hotel/flight search results
3. **Rate Limiting:** Distributed rate limit counters

### Configuration

```bash
# .env
REDIS_URL=redis://localhost:6379
```

### Fallback Behavior

If Redis is unavailable:
- CSRF tokens: In-memory Map (single-instance only)
- Cache: Disabled
- Application continues to function

## Environment Variables

### Required Security Variables

```bash
# JWT Secrets (must be strong random strings)
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001

# Redis (optional but recommended for production)
REDIS_URL=redis://localhost:6379
```

### Generating Secure Secrets

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security Headers

### Helmet.js Configuration

Automatically sets secure HTTP headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS only)
- `Content-Security-Policy`

## Database Security

### Prisma ORM

- **SQL Injection Prevention:** Parameterized queries
- **Type Safety:** TypeScript + Prisma schema validation
- **Password Hashing:** bcrypt with salt rounds = 10

### Refresh Token Management

```typescript
// Refresh tokens stored in database
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Client Implementation Guide

### Getting CSRF Token

```javascript
// 1. Get CSRF token
const response = await fetch('http://localhost:3000/api/auth/csrf-token', {
  credentials: 'include'  // Important: include cookies
});
const { data } = await response.json();
const csrfToken = data.csrfToken;
```

### Making Authenticated Requests

```javascript
// 2. Use CSRF token in requests
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken  // Include CSRF token
  },
  credentials: 'include',  // Include cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    firstName: 'John',
    lastName: 'Doe'
  })
});

// Response sets httpOnly cookies automatically
// No need to handle tokens in JavaScript
```

### Logout

```javascript
const response = await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  credentials: 'include'  // Include cookies to identify session
});

// Cookies are cleared automatically
```

## Monitoring & Logging

### Security Events Logged

- Failed login attempts
- Invalid CSRF tokens
- CORS violations
- Rate limit exceeded
- Unauthorized access attempts

### Log Levels

- `error`: Security violations, failed authentications
- `warn`: Rate limits, suspicious patterns
- `info`: Normal operations, successful auth

## Testing Security

### CSRF Protection Test

```bash
# Should succeed
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: valid-token" \
  -d '{"email":"test@example.com","password":"password123"}'

# Should fail (403)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Cookie-Based Auth Test

```bash
# Login and save cookies
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"password123"}'

# Use cookies for authenticated request
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

## Production Checklist

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure `FRONTEND_URL` with production domain
- [ ] Set up Redis with persistence
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set `NODE_ENV=production`
- [ ] Configure Sentry or error monitoring
- [ ] Review and test CORS policy
- [ ] Set up database backups
- [ ] Configure rate limiting for production traffic
- [ ] Enable database connection pooling

## Vulnerability Disclosure

If you discover a security vulnerability, please email: security@travelhub.com

**Do not** open a public GitHub issue for security vulnerabilities.

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
