# 🚀 TravelHub Ultimate - API Endpoints Documentation

**Last Updated:** December 22, 2025
**API Version:** 1.0
**Base URL:** `http://localhost:3000` (development)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Hotels](#hotels)
3. [Flights](#flights)
4. [Bookings](#bookings)
5. [Favorites](#favorites)
6. [Price Alerts](#price-alerts)
7. [Payment](#payment)
8. [Notifications](#notifications)
9. [Analytics](#analytics)
10. [Affiliate Program](#affiliate-program)
11. [Admin Panel](#admin-panel)

---

## 🔐 Authentication

All authenticated endpoints require JWT token in cookies or Authorization header.

### POST /api/auth/register
Register new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+79991234567"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "...", "role": "user" },
    "token": "jwt_token"
  }
}
```

### POST /api/auth/login
Login to existing account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK` + Sets HttpOnly cookie

### POST /api/auth/logout
Logout current user.

**Response:** `200 OK`

### GET /api/auth/me
Get current user profile.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

---

## 🏨 Hotels

### POST /api/hotels/search
Search for hotels.

**Body:**
```json
{
  "destination": "Moscow",
  "checkIn": "2025-12-25",
  "checkOut": "2025-12-28",
  "adults": 2,
  "rooms": 1
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Hotels search successful",
  "data": [
    {
      "id": "hotel_123",
      "name": "Grand Hotel Moscow",
      "price": 15000,
      "currency": "RUB",
      "rating": 4.5,
      "image": "https://...",
      "location": "Moscow, Russia"
    }
  ]
}
```

---

## ✈️ Flights

### GET /api/flights/search
Search for flights.

**Query Parameters:**
- `origin` - Origin airport/city (required)
- `destination` - Destination airport/city (required)
- `departDate` - Departure date YYYY-MM-DD (required)
- `returnDate` - Return date YYYY-MM-DD (optional)
- `passengers` - Number of passengers (default: 1)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "flights": [
      {
        "id": "FL001",
        "airline": "Aeroflot",
        "origin": "MOW",
        "destination": "LED",
        "departTime": "2025-12-25T10:00:00Z",
        "arriveTime": "2025-12-25T11:30:00Z",
        "price": { "amount": 8500, "currency": "RUB" },
        "class": "economy"
      }
    ],
    "count": 15
  }
}
```

### GET /api/flights/:id
Get flight details.

**Response:** `200 OK`

### GET /api/flights/popular/destinations
Get popular flight destinations.

**Response:** `200 OK`

---

## 📅 Bookings

### GET /api/bookings
Get user's bookings.

**Query Parameters:**
- `status` - Filter by status (optional)
- `type` - Filter by type: hotel, flight, package (optional)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "booking_123",
      "type": "hotel",
      "status": "confirmed",
      "itemName": "Grand Hotel Moscow",
      "checkIn": "2025-12-25T00:00:00Z",
      "checkOut": "2025-12-28T00:00:00Z",
      "totalPrice": 45000,
      "currency": "RUB",
      "createdAt": "2025-12-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### POST /api/bookings
Create new booking.

**Body:**
```json
{
  "type": "hotel",
  "itemId": "hotel_123",
  "itemName": "Grand Hotel Moscow",
  "itemImage": "https://...",
  "checkIn": "2025-12-25",
  "checkOut": "2025-12-28",
  "guests": 2,
  "rooms": 1,
  "totalPrice": 45000,
  "currency": "RUB",
  "specialRequests": "Late check-in"
}
```

**Response:** `201 Created`

**Note:** Automatically tracks affiliate conversion if referral code exists.

### GET /api/bookings/:id
Get booking details.

**Response:** `200 OK`

### PATCH /api/bookings/:id/cancel
Cancel booking.

**Response:** `200 OK`

---

## ⭐ Favorites

### GET /api/favorites
Get user's favorite items.

**Response:** `200 OK`

### POST /api/favorites
Add item to favorites.

**Body:**
```json
{
  "itemId": "hotel_123",
  "itemType": "hotel",
  "itemName": "Grand Hotel Moscow",
  "itemImage": "https://...",
  "itemPrice": 15000,
  "currency": "RUB"
}
```

**Response:** `201 Created`

### DELETE /api/favorites/:id
Remove from favorites.

**Response:** `200 OK`

---

## 🔔 Price Alerts

### GET /api/price-alerts
Get user's price alerts.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_123",
      "type": "hotel",
      "destination": "Paris",
      "targetPrice": 12000,
      "currentPrice": 15000,
      "currency": "RUB",
      "status": "active",
      "createdAt": "2025-12-22T10:00:00Z"
    }
  ]
}
```

### POST /api/price-alerts
Create price alert.

**Body:**
```json
{
  "type": "hotel",
  "destination": "Paris",
  "checkIn": "2026-01-15",
  "checkOut": "2026-01-20",
  "targetPrice": 12000,
  "currency": "RUB"
}
```

**Response:** `201 Created`

### PATCH /api/price-alerts/:id
Update price alert.

**Response:** `200 OK`

### DELETE /api/price-alerts/:id
Delete price alert.

**Response:** `200 OK`

---

## 💳 Payment

### POST /api/payment/create-intent
Create payment intent.

**Body:**
```json
{
  "bookingId": "booking_123",
  "amount": 45000,
  "currency": "RUB"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "pi_123",
    "clientSecret": "pi_123_secret_abc",
    "amount": 45000,
    "currency": "RUB"
  }
}
```

### POST /api/payment/process
Process payment.

**Response:** `200 OK`

### GET /api/payment/status/:bookingId
Get payment status.

**Response:** `200 OK`

### POST /api/payment/refund
Request refund.

**Response:** `200 OK`

### POST /api/payment/webhook
Payment gateway webhook (Stripe, PayPal, etc.)

**Response:** `200 OK`

---

## 🔔 Notifications

### GET /api/notifications
Get user notifications.

**Query Parameters:**
- `unreadOnly` - Show only unread (default: false)
- `limit` - Items per page (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:** `200 OK`

### GET /api/notifications/unread/count
Get unread notifications count.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": { "count": 5 }
}
```

### PATCH /api/notifications/:id/read
Mark notification as read.

**Response:** `200 OK`

### PATCH /api/notifications/read-all
Mark all notifications as read.

**Response:** `200 OK`

### DELETE /api/notifications/:id
Delete notification.

**Response:** `200 OK`

---

## 📊 Analytics

### POST /api/analytics/track
Track custom event.

**Body:**
```json
{
  "event": "hotel_search",
  "metadata": {
    "destination": "Moscow",
    "checkIn": "2025-12-25"
  },
  "value": 45000,
  "currency": "RUB"
}
```

**Response:** `200 OK`

### GET /api/analytics/metrics/daily
Get daily metrics.

**Query Parameters:**
- `date` - Date YYYY-MM-DD (optional, default: today)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalEvents": 1250,
    "searchCount": 450,
    "bookingCount": 28,
    "revenue": 1250000,
    "userSignups": 15
  }
}
```

### GET /api/analytics/funnel
Get conversion funnel.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "searches": 450,
    "bookingStarted": 120,
    "paymentStarted": 85,
    "completed": 72,
    "conversionRate": 16.0
  }
}
```

### GET /api/analytics/trends/search?days=7
Get search trends.

**Response:** `200 OK`

### GET /api/analytics/trends/revenue?days=7
Get revenue trends.

**Response:** `200 OK`

### GET /api/analytics/active-users
Get real-time active users count.

**Response:** `200 OK`

### GET /api/analytics/top-performers
Get top performers (users/affiliates).

**Query Parameters:**
- `type` - bookings, revenue, referrals (default: bookings)
- `limit` - Number of results (default: 10)

**Response:** `200 OK`

---

## 💰 Affiliate Program

### POST /api/affiliate/register
Register as affiliate.

**Body:**
```json
{
  "companyName": "My Travel Agency",
  "website": "https://example.com",
  "description": "Leading travel agency",
  "paymentMethod": "paypal",
  "paymentDetails": {
    "paypalEmail": "payments@example.com"
  }
}
```

**Response:** `201 Created`

### GET /api/affiliate/dashboard
Get affiliate dashboard stats.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalClicks": 1250,
    "totalConversions": 45,
    "totalEarnings": 67500,
    "pendingEarnings": 15000,
    "approvedEarnings": 42500,
    "paidEarnings": 10000,
    "conversionRate": 3.6,
    "referralCode": "AFFILIATE123"
  }
}
```

### GET /api/affiliate/clicks
Get click statistics.

**Response:** `200 OK`

### GET /api/affiliate/conversions
Get conversions list.

**Response:** `200 OK`

### GET /api/affiliate/commissions
Get commissions.

**Response:** `200 OK`

### POST /api/affiliate/payouts/request
Request payout.

**Body:**
```json
{
  "amount": 10000,
  "method": "paypal"
}
```

**Response:** `201 Created`

### GET /api/affiliate/payouts
Get payout history.

**Response:** `200 OK`

### GET /api/affiliate/settings
Get affiliate settings.

**Response:** `200 OK`

### PUT /api/affiliate/settings
Update affiliate settings.

**Response:** `200 OK`

---

## 👨‍💼 Admin Panel

**Note:** All admin routes require `role: admin`

### GET /api/admin/stats
Get admin dashboard statistics.

**Response:** `200 OK`

### GET /api/admin/users
Get all users.

**Response:** `200 OK`

### GET /api/admin/users/:id
Get user details.

**Response:** `200 OK`

### PATCH /api/admin/users/:id/status
Update user status.

**Response:** `200 OK`

### GET /api/admin/bookings
Get all bookings.

**Response:** `200 OK`

### GET /api/admin/affiliates
Get all affiliates.

**Response:** `200 OK`

### PATCH /api/admin/affiliates/:id/verify
Verify affiliate.

**Response:** `200 OK`

### GET /api/admin/commissions
Get all commissions.

**Response:** `200 OK`

### PATCH /api/admin/commissions/:id/approve
Approve commission.

**Response:** `200 OK`

### GET /api/admin/payouts
Get all payouts.

**Response:** `200 OK`

### POST /api/admin/payouts/:id/process
Process payout.

**Response:** `200 OK`

### GET /api/admin/settings/affiliate
Get affiliate settings.

**Response:** `200 OK`

### PUT /api/admin/settings/affiliate
Update affiliate settings.

**Response:** `200 OK`

---

## 🔧 Rate Limiting

Rate limits are applied to all endpoints:

- **Strict** (10 req/15min): Login, Register
- **Moderate** (100 req/15min): Search, Bookings, Payments
- **Lenient** (200 req/15min): Favorites, Notifications, Analytics
- **Very Lenient** (500 req/15min): Read-only endpoints

---

## 🔐 Authentication

**Cookie-based Authentication:**
- HttpOnly cookie set on login
- Secure in production
- SameSite: strict
- Auto-renewed on requests

**Header-based Authentication:**
```
Authorization: Bearer <jwt_token>
```

---

## 📦 Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## 🎯 Affiliate Tracking

**Referral Links:**
```
https://travelhub.com/?ref=PARTNER123
```

**Auto-tracking:**
- Middleware tracks all requests with `?ref=` parameter
- Sets 30-day cookie
- Automatically attributes conversions
- Multi-level commission distribution (3 levels)

---

## 🚀 Performance Features

- **Redis Caching:** Search results, hotel details, user sessions
- **Rate Limiting:** 4-tier system protects against abuse
- **Analytics:** Real-time tracking with daily aggregation
- **Background Jobs:** Auto-approve commissions, price checks, reminders

---

## 📚 Additional Resources

- **Swagger UI:** `/api-docs`
- **Swagger JSON:** `/api-docs.json`
- **Health Check:** `/health` or `/api/health`
- **Root Endpoint:** `/` (API overview)

---

**Total Endpoints:** 70+
**Authenticated Endpoints:** 60+
**Public Endpoints:** 10

**Built with:** Express.js, TypeScript, Prisma, PostgreSQL, Redis
