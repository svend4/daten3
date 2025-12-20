# 🔧 Railway Environment Variables Setup

## Current Configuration

The frontend is configured via `railway-frontend.toml`:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "frontend/Dockerfile"

[deploy]
startCommand = "nginx -g 'daemon off;'"
healthcheckPath = "/"

[[envs]]
VITE_API_BASE_URL = "${{BACKEND_URL}}/api"
```

## ⚡ Quick Setup (After Deployment Succeeds)

### Option 1: Using Railway Service References (Recommended)

If both backend and frontend are in the same Railway project:

1. Go to **Railway Dashboard** → **Frontend Service** → **Variables**
2. Add:
```bash
VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api
```

**How it works:**
- Railway automatically injects the backend's public domain
- Format: `${{ServiceName.RAILWAY_PUBLIC_DOMAIN}}`
- No need to manually update when backend URL changes

### Option 2: Using Static URL

If backend is deployed separately or you know the URL:

1. Go to **Railway Dashboard** → **Frontend Service** → **Variables**
2. Find your backend URL from **Backend Service** → **Settings** → **Public Networking**
3. Add:
```bash
# Example with actual backend URL
VITE_API_BASE_URL=https://daten3-travelbackend.up.railway.app/api
```

### Option 3: Using Multiple Environments

For development, staging, and production:

```bash
# Production (Railway)
VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api

# Staging (if you have staging backend)
VITE_API_BASE_URL=${{BackendStaging.RAILWAY_PUBLIC_DOMAIN}}/api

# Development (local)
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 📋 Complete Environment Variables List

### Required Variables

```bash
# Backend API endpoint (REQUIRED)
VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api
```

### Optional Variables

```bash
# API request timeout in milliseconds
VITE_API_TIMEOUT=30000

# Enable/disable analytics
VITE_ENABLE_ANALYTICS=false

# Google Analytics tracking ID (if enabled)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Sentry DSN for error tracking (optional)
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Environment name
VITE_ENV=production
```

---

## 🔄 How to Apply Changes

### Method 1: Railway UI (Easiest)

1. Open [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on **Frontend** service
4. Go to **Variables** tab
5. Click **+ New Variable**
6. Enter name: `VITE_API_BASE_URL`
7. Enter value: `${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api`
8. Click **Add**
9. Railway will **automatically redeploy** the service

### Method 2: Railway CLI

```bash
# Set variable via CLI
railway variables set VITE_API_BASE_URL='${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api'

# Verify variable was set
railway variables

# Manually trigger redeploy (if needed)
railway redeploy
```

### Method 3: Update railway-frontend.toml (Permanent)

The `railway-frontend.toml` already has a template:

```toml
[[envs]]
VITE_API_BASE_URL = "${{BACKEND_URL}}/api"
```

**To fix it:**

1. Update `BACKEND_URL` to use actual service reference:
```toml
[[envs]]
VITE_API_BASE_URL = "${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api"
```

2. Commit and push:
```bash
git add railway-frontend.toml
git commit -m "Fix Railway environment variable reference"
git push -u origin claude/extract-travel-agency-code-sdASp
```

---

## 🎯 Verification

After setting variables and redeploying:

### 1. Check Railway Logs

```bash
railway logs --service frontend

# Look for environment variables during build:
# "VITE_API_BASE_URL=https://..."
```

### 2. Check Browser Console

Open https://daten3-travelfrontend.up.railway.app and check console:

```javascript
// Frontend should make requests to:
// https://[backend-url].up.railway.app/api/...

// Check network tab in DevTools
// Filter by: /api/
```

### 3. Test API Connectivity

```bash
# From frontend, try fetching from backend
curl -i https://daten3-travelfrontend.up.railway.app

# Check if JavaScript is making API calls to backend
# Should NOT see localhost:3000 in network tab
```

---

## 🐛 Troubleshooting

### Issue: `VITE_API_BASE_URL` is `undefined`

**Cause:** Environment variable not set or not prefixed with `VITE_`

**Solution:**
- Ensure variable name starts with `VITE_` (Vite requirement)
- Check Railway Variables tab shows the variable
- Redeploy after adding variable

### Issue: API calls go to `localhost:3000`

**Cause:** Frontend is using fallback value from `api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
```

**Solution:**
- Set `VITE_API_BASE_URL` in Railway Variables
- Redeploy frontend
- Verify variable is visible during build in logs

### Issue: CORS errors in browser

**Cause:** Backend doesn't allow frontend origin

**Solution:**
1. Go to **Backend Service** → **Variables**
2. Add or update:
```bash
FRONTEND_URL=https://daten3-travelfrontend.up.railway.app
ALLOWED_ORIGINS=https://daten3-travelfrontend.up.railway.app
```
3. Verify backend CORS middleware:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```
4. Redeploy backend

### Issue: `${{Backend.RAILWAY_PUBLIC_DOMAIN}}` not resolving

**Cause:** Service name mismatch or services in different projects

**Solution:**
1. Check exact service name in Railway:
   - Dashboard → Services → Note the exact name
   - It might be "backend", "Backend", "api", etc.
2. Update variable to match:
```bash
# If service name is "backend"
${{backend.RAILWAY_PUBLIC_DOMAIN}}/api

# If service name is "Backend"
${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api

# If service name is "travelhub-backend"
${{travelhub-backend.RAILWAY_PUBLIC_DOMAIN}}/api
```
3. Or use static URL as fallback

---

## 📚 Railway Service References

Railway provides automatic variable injection:

| Variable | Description | Example |
|----------|-------------|---------|
| `${{ServiceName.RAILWAY_PUBLIC_DOMAIN}}` | Public domain | `myapp-production.up.railway.app` |
| `${{ServiceName.RAILWAY_PRIVATE_DOMAIN}}` | Private network domain | `myapp.railway.internal` |
| `${{Postgres.DATABASE_URL}}` | PostgreSQL connection | `postgresql://...` |
| `${{Redis.REDIS_URL}}` | Redis connection | `redis://...` |

**Docs:** https://docs.railway.app/deploy/variables#service-variables

---

## ✅ Final Checklist

Before testing:

- [ ] `VITE_API_BASE_URL` set in Railway Variables
- [ ] Value uses `${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api` format
- [ ] Frontend redeployed after variable added
- [ ] Backend has `FRONTEND_URL` or `ALLOWED_ORIGINS` set
- [ ] Backend CORS middleware configured correctly
- [ ] Both services in same Railway project (for service references)
- [ ] Deployment logs show no errors
- [ ] Health check passes: `/health.html`
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows API calls to backend domain

---

## 🔗 Helpful Commands

```bash
# View all variables
railway variables

# Set a variable
railway variables set KEY=VALUE

# Delete a variable
railway variables delete KEY

# View service info
railway status

# Open in browser
railway open

# View logs
railway logs --follow

# Redeploy current service
railway redeploy

# Connect to specific service
railway link [service-name]
```

---

**Last Updated:** 2025-12-20
**Status:** Ready for configuration after deployment succeeds
