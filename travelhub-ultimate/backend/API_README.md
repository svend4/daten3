# 📡 TravelHub Ultimate API Documentation

**Version:** 1.0.0
**Base URL:** `http://localhost:3000/api`
**Environment:** Development

---

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration
- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

---

## 📚 API Endpoints

### 🔑 Authentication (`/api/auth`)

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "+1234567890" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Validation Rules:**
- Email: Valid email format
- Password: Min 8 characters, must contain uppercase, lowercase, and number
- Name: 2-100 characters
- Phone: Valid mobile phone number (optional)

---

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email."
}
```

---

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass123"
}
```

---

#### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

---

#### Update Profile (Protected)
```http
PUT /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "+9876543210"
}
```

---

#### Change Password (Protected)
```http
PUT /api/auth/me/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Validation:**
- New password must be different from current password
- Min 8 characters, uppercase, lowercase, number required

---

### 📝 Bookings (`/api/bookings`)

**All routes require authentication**

#### Get All Bookings
```http
GET /api/bookings?status=confirmed&type=hotel&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: pending | confirmed | cancelled | completed
- `type`: hotel | flight | car
- `page`: Page number (min: 1)
- `limit`: Items per page (1-100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking_1",
      "userId": "user_123",
      "type": "hotel",
      "status": "confirmed",
      "details": {
        "hotelName": "Grand Hotel",
        "checkIn": "2025-01-15",
        "checkOut": "2025-01-20",
        "guests": 2
      },
      "totalAmount": 500.00,
      "currency": "USD",
      "createdAt": "2024-12-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

#### Get Single Booking
```http
GET /api/bookings/:id
Authorization: Bearer <token>
```

---

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "hotel",
  "itemId": "hotel_456",
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-20",
  "guests": 2,
  "rooms": 1,
  "totalAmount": 500.00,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "referralCode": "REF123456"
}
```

**Validation Rules:**
- `type`: Required, must be 'hotel', 'flight', or 'car'
- `itemId`: Required string
- `checkIn`: ISO 8601 date, must be today or future
- `checkOut`: ISO 8601 date, must be after checkIn
- `guests`: 1-20
- `rooms`: 1-10
- `totalAmount`: Required, positive number
- `currency`: Valid ISO 4217 code (USD, EUR, etc.)
- `paymentMethod`: credit_card | debit_card | paypal | bank_transfer
- `referralCode`: 6-20 characters (optional)

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "booking_789",
    "userId": "user_123",
    "type": "hotel",
    "status": "confirmed",
    "confirmationNumber": "TH8X9K2L",
    "totalAmount": 500.00,
    "currency": "USD",
    "createdAt": "2024-12-20T10:30:00Z"
  }
}
```

---

#### Update Booking Status
```http
PATCH /api/bookings/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Validation:**
- `status`: pending | confirmed | cancelled | completed

---

#### Cancel Booking
```http
DELETE /api/bookings/:id
Authorization: Bearer <token>
```

---

### ⭐ Favorites (`/api/favorites`)

**All routes require authentication**

#### Get Favorites
```http
GET /api/favorites?type=hotel
Authorization: Bearer <token>
```

**Query Parameters:**
- `type`: hotel | flight | car (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fav_1",
      "userId": "user_123",
      "type": "hotel",
      "itemId": "hotel_123",
      "itemData": {
        "name": "Grand Hotel",
        "location": "Paris, France",
        "rating": 4.8,
        "price": 150
      },
      "createdAt": "2024-12-10T10:00:00Z"
    }
  ]
}
```

---

#### Add to Favorites
```http
POST /api/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "hotel",
  "itemId": "hotel_456",
  "itemData": {
    "name": "Luxury Resort",
    "location": "Bali, Indonesia",
    "rating": 4.9,
    "price": 200
  }
}
```

**Validation:**
- `type`: Required, hotel | flight | car
- `itemId`: Required string
- `itemData`: Optional object
- `itemData.name`: String
- `itemData.location`: String
- `itemData.price`: Positive number
- `itemData.rating`: 0-5

---

#### Remove from Favorites
```http
DELETE /api/favorites/:id
Authorization: Bearer <token>
```

---

#### Check if Favorited
```http
GET /api/favorites/check/:type/:itemId
Authorization: Bearer <token>
```

**Example:**
```http
GET /api/favorites/check/hotel/hotel_456
```

**Response:**
```json
{
  "success": true,
  "isFavorited": false,
  "data": null
}
```

---

### 🔔 Price Alerts (`/api/price-alerts`)

**All routes require authentication**

#### Get Price Alerts
```http
GET /api/price-alerts
Authorization: Bearer <token>
```

#### Create Price Alert
```http
POST /api/price-alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "hotel",
  "itemId": "hotel_123",
  "targetPrice": 120.00,
  "currency": "USD"
}
```

#### Update Price Alert
```http
PATCH /api/price-alerts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetPrice": 100.00
}
```

#### Delete Price Alert
```http
DELETE /api/price-alerts/:id
Authorization: Bearer <token>
```

---

### 💰 Affiliate (`/api/affiliate`)

#### Get Dashboard
```http
GET /api/affiliate/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "affiliate": {
      "id": "affiliate_1",
      "referralCode": "REF123456",
      "level": 1,
      "status": "active",
      "totalEarnings": 1250.50,
      "totalReferrals": 15
    },
    "stats": {
      "clicks": 342,
      "conversions": 15,
      "conversionRate": "4.39",
      "earnings": {
        "pending": 125.00,
        "approved": 875.50,
        "paid": 250.00,
        "total": 1250.50
      }
    }
  }
}
```

#### Get Referral Tree
```http
GET /api/affiliate/referral-tree
Authorization: Bearer <token>
```

#### Get Earnings
```http
GET /api/affiliate/earnings
Authorization: Bearer <token>
```

#### Get Payouts
```http
GET /api/affiliate/payouts
Authorization: Bearer <token>
```

#### Request Payout
```http
POST /api/affiliate/payouts/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 250.00,
  "method": "bank_transfer"
}
```

#### Get Affiliate Links
```http
GET /api/affiliate/links
Authorization: Bearer <token>
```

---

### 👑 Admin (`/api/admin`)

**All routes require admin role**

#### Get All Affiliates
```http
GET /api/admin/affiliates
Authorization: Bearer <admin_token>
```

#### Update Affiliate Status
```http
PATCH /api/admin/affiliates/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "active"
}
```

#### Get All Commissions
```http
GET /api/admin/commissions
Authorization: Bearer <admin_token>
```

#### Approve Commission
```http
PATCH /api/admin/commissions/:id/approve
Authorization: Bearer <admin_token>
```

#### Get Analytics
```http
GET /api/admin/analytics
Authorization: Bearer <admin_token>
```

---

## 🛡️ Security Features

### Rate Limiting

Different endpoints have different rate limits:

- **Strict** (5 req/min): Registration, password reset
- **Moderate** (20 req/min): Login, most API calls
- **Lenient** (50 req/min): Token refresh, reads
- **Very Lenient** (100 req/min): Public data

### Security Headers

- **Helmet.js**: CSP, HSTS, X-Frame-Options
- **CORS**: Configurable allowed origins
- **JWT**: Secure token-based authentication

---

## ❌ Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided. Please login."
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Admin privileges required. Access denied."
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Cannot GET /api/invalid-route - Route not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Something went wrong. Please try again later."
}
```

---

## 🧪 Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Get bookings (with token)
curl -X GET http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the base URL: `http://localhost:3000/api`
2. Set environment variable `token` after login
3. Use `{{token}}` in Authorization header

---

## 📦 Dependencies

- **express**: Web framework
- **express-validator**: Request validation
- **jsonwebtoken**: JWT authentication
- **bcrypt**: Password hashing
- **helmet**: Security headers
- **cors**: CORS handling
- **express-rate-limit**: Rate limiting
- **winston**: Logging
- **morgan**: HTTP request logging

---

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Server runs at: `http://localhost:3000`

---

## 📝 Notes

- All dates should be in ISO 8601 format
- All monetary values should be numbers (not strings)
- Token expiration is handled automatically
- Refresh tokens should be stored securely on the client

---

**Last Updated:** 2025-12-20
**Maintained by:** TravelHub Development Team
