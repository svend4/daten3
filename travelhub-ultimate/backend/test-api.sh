#!/bin/bash

# TravelHub Ultimate API - Comprehensive Test Script
# This script tests all 52 API endpoints

BASE_URL="https://daten3-travelbackend.up.railway.app"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Global variables for tokens
ACCESS_TOKEN=""
REFRESH_TOKEN=""
ADMIN_TOKEN=""

# Function to print test result
print_result() {
    local test_name="$1"
    local status_code="$2"
    local expected="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$status_code" == "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name (HTTP $status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name (Expected: $expected, Got: $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to make API call and extract status
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local auth_header="$4"

    if [ -n "$auth_header" ]; then
        if [ -n "$data" ]; then
            curl -s -o /dev/null -w "%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data" \
                "$BASE_URL$endpoint"
        else
            curl -s -o /dev/null -w "%{http_code}" -X "$method" \
                -H "Authorization: Bearer $auth_header" \
                "$BASE_URL$endpoint"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -o /dev/null -w "%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BASE_URL$endpoint"
        else
            curl -s -o /dev/null -w "%{http_code}" -X "$method" \
                "$BASE_URL$endpoint"
        fi
    fi
}

# Function to register user and get token
register_and_login() {
    local email="$1"
    local password="$2"
    local role="${3:-user}"

    # Register
    local register_data="{\"email\":\"$email\",\"password\":\"$password\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$register_data" \
        "$BASE_URL/api/auth/register" > /dev/null 2>&1

    # Login and extract token
    local login_data="{\"email\":\"$email\",\"password\":\"$password\"}"
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$login_data" \
        "$BASE_URL/api/auth/login")

    echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TravelHub Ultimate API - Comprehensive Test        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Backend URL:${NC} $BASE_URL"
echo ""

# ============================================
# HEALTH ENDPOINTS (2)
# ============================================
echo -e "\n${BLUE}━━━ Health Endpoints (2) ━━━${NC}\n"

STATUS=$(test_endpoint "GET" "/health" "" "")
print_result "GET /health" "$STATUS" "200"

STATUS=$(test_endpoint "GET" "/api/health" "" "")
print_result "GET /api/health" "$STATUS" "200"

# ============================================
# ROOT ENDPOINT (1)
# ============================================
echo -e "\n${BLUE}━━━ Root Endpoint (1) ━━━${NC}\n"

STATUS=$(test_endpoint "GET" "/" "" "")
print_result "GET / (API Info)" "$STATUS" "200"

# ============================================
# PUBLIC SEARCH ENDPOINTS (4)
# ============================================
echo -e "\n${BLUE}━━━ Public Search Endpoints (4) ━━━${NC}\n"

STATUS=$(test_endpoint "GET" "/api/hotels/search" "" "")
print_result "GET /api/hotels/search (Info)" "$STATUS" "200"

SEARCH_DATA='{"destination":"Paris","checkIn":"2025-06-01","checkOut":"2025-06-05","adults":2,"rooms":1}'
STATUS=$(test_endpoint "POST" "/api/hotels/search" "$SEARCH_DATA" "")
print_result "POST /api/hotels/search" "$STATUS" "200"

STATUS=$(test_endpoint "GET" "/api/flights/search" "" "")
print_result "GET /api/flights/search (Info)" "$STATUS" "200"

FLIGHT_DATA='{"from":"NYC","to":"PAR","departDate":"2025-06-01","adults":1}'
STATUS=$(test_endpoint "POST" "/api/flights/search" "$FLIGHT_DATA" "")
print_result "POST /api/flights/search" "$STATUS" "200"

# ============================================
# AUTHENTICATION - PUBLIC ENDPOINTS (7)
# ============================================
echo -e "\n${BLUE}━━━ Authentication - Public Endpoints (7) ━━━${NC}\n"

# Generate unique email for this test run
TIMESTAMP=$(date +%s)
TEST_USER_EMAIL="testuser${TIMESTAMP}@example.com"
TEST_ADMIN_EMAIL="testadmin${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPass123!"

# 1. Register
REGISTER_DATA="{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
STATUS=$(test_endpoint "POST" "/api/auth/register" "$REGISTER_DATA" "")
print_result "POST /api/auth/register" "$STATUS" "201"

# 2. Login
LOGIN_DATA="{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" \
    "$BASE_URL/api/auth/login")
STATUS=$(echo "$LOGIN_RESPONSE" | grep -q "accessToken" && echo "200" || echo "401")
print_result "POST /api/auth/login" "$STATUS" "200"

# Extract tokens
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

# 3. Refresh Token
if [ -n "$REFRESH_TOKEN" ]; then
    REFRESH_DATA="{\"refreshToken\":\"$REFRESH_TOKEN\"}"
    STATUS=$(test_endpoint "POST" "/api/auth/refresh" "$REFRESH_DATA" "")
    print_result "POST /api/auth/refresh" "$STATUS" "200"
else
    echo -e "${YELLOW}⚠ SKIP${NC} - POST /api/auth/refresh (No refresh token)"
fi

# 4. Forgot Password
FORGOT_DATA="{\"email\":\"$TEST_USER_EMAIL\"}"
STATUS=$(test_endpoint "POST" "/api/auth/forgot-password" "$FORGOT_DATA" "")
print_result "POST /api/auth/forgot-password" "$STATUS" "200"

# 5. Reset Password
RESET_DATA="{\"token\":\"dummy-token\",\"newPassword\":\"NewPass123!\"}"
STATUS=$(test_endpoint "POST" "/api/auth/reset-password" "$RESET_DATA" "")
print_result "POST /api/auth/reset-password" "$STATUS" "400"

# 6. Google Auth
STATUS=$(test_endpoint "GET" "/api/auth/google" "" "")
print_result "GET /api/auth/google" "$STATUS" "302"

# 7. Google Callback
STATUS=$(test_endpoint "GET" "/api/auth/google/callback" "" "")
print_result "GET /api/auth/google/callback" "$STATUS" "302"

# ============================================
# AUTHENTICATION - PROTECTED ENDPOINTS (4)
# ============================================
echo -e "\n${BLUE}━━━ Authentication - Protected Endpoints (4) ━━━${NC}\n"

if [ -n "$ACCESS_TOKEN" ]; then
    # 1. Get Current User
    STATUS=$(test_endpoint "GET" "/api/auth/me" "" "$ACCESS_TOKEN")
    print_result "GET /api/auth/me" "$STATUS" "200"

    # 2. Update Profile
    UPDATE_DATA='{"firstName":"Updated","lastName":"Name"}'
    STATUS=$(test_endpoint "PUT" "/api/auth/me" "$UPDATE_DATA" "$ACCESS_TOKEN")
    print_result "PUT /api/auth/me" "$STATUS" "200"

    # 3. Change Password
    PASS_DATA="{\"currentPassword\":\"$TEST_PASSWORD\",\"newPassword\":\"NewPass456!\"}"
    STATUS=$(test_endpoint "PUT" "/api/auth/me/password" "$PASS_DATA" "$ACCESS_TOKEN")
    print_result "PUT /api/auth/me/password" "$STATUS" "200"

    # 4. Delete Account
    STATUS=$(test_endpoint "DELETE" "/api/auth/me" "" "$ACCESS_TOKEN")
    print_result "DELETE /api/auth/me" "$STATUS" "200"
else
    echo -e "${YELLOW}⚠ SKIP${NC} - Protected auth endpoints (No access token)"
fi

# Re-register user for further tests
ACCESS_TOKEN=$(register_and_login "$TEST_USER_EMAIL" "$TEST_PASSWORD")

# ============================================
# BOOKINGS ENDPOINTS (5)
# ============================================
echo -e "\n${BLUE}━━━ Bookings Endpoints (5) ━━━${NC}\n"

if [ -n "$ACCESS_TOKEN" ]; then
    # 1. Get Bookings
    STATUS=$(test_endpoint "GET" "/api/bookings" "" "$ACCESS_TOKEN")
    print_result "GET /api/bookings" "$STATUS" "200"

    # 2. Create Booking
    BOOKING_DATA='{"type":"hotel","itemId":"hotel_123","checkIn":"2025-06-01","checkOut":"2025-06-05","totalPrice":500}'
    CREATE_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d "$BOOKING_DATA" \
        "$BASE_URL/api/bookings")
    STATUS=$(echo "$CREATE_RESPONSE" | grep -q "success" && echo "201" || echo "400")
    print_result "POST /api/bookings" "$STATUS" "201"

    BOOKING_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

    # 3. Get Single Booking
    if [ -n "$BOOKING_ID" ]; then
        STATUS=$(test_endpoint "GET" "/api/bookings/$BOOKING_ID" "" "$ACCESS_TOKEN")
        print_result "GET /api/bookings/:id" "$STATUS" "200"

        # 4. Update Booking Status
        STATUS_DATA='{"status":"confirmed"}'
        STATUS=$(test_endpoint "PATCH" "/api/bookings/$BOOKING_ID/status" "$STATUS_DATA" "$ACCESS_TOKEN")
        print_result "PATCH /api/bookings/:id/status" "$STATUS" "200"

        # 5. Cancel Booking
        STATUS=$(test_endpoint "DELETE" "/api/bookings/$BOOKING_ID" "" "$ACCESS_TOKEN")
        print_result "DELETE /api/bookings/:id" "$STATUS" "200"
    else
        echo -e "${YELLOW}⚠ SKIP${NC} - Booking detail endpoints (No booking ID)"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC} - Bookings endpoints (No access token)"
fi

# ============================================
# FAVORITES ENDPOINTS (4)
# ============================================
echo -e "\n${BLUE}━━━ Favorites Endpoints (4) ━━━${NC}\n"

if [ -n "$ACCESS_TOKEN" ]; then
    # 1. Get Favorites
    STATUS=$(test_endpoint "GET" "/api/favorites" "" "$ACCESS_TOKEN")
    print_result "GET /api/favorites" "$STATUS" "200"

    # 2. Add to Favorites
    FAV_DATA='{"type":"hotel","itemId":"hotel_456","name":"Test Hotel","location":"Paris"}'
    ADD_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d "$FAV_DATA" \
        "$BASE_URL/api/favorites")
    STATUS=$(echo "$ADD_RESPONSE" | grep -q "success" && echo "201" || echo "400")
    print_result "POST /api/favorites" "$STATUS" "201"

    FAV_ID=$(echo "$ADD_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

    # 3. Check Favorite
    STATUS=$(test_endpoint "GET" "/api/favorites/check/hotel/hotel_456" "" "$ACCESS_TOKEN")
    print_result "GET /api/favorites/check/:type/:itemId" "$STATUS" "200"

    # 4. Remove from Favorites
    if [ -n "$FAV_ID" ]; then
        STATUS=$(test_endpoint "DELETE" "/api/favorites/$FAV_ID" "" "$ACCESS_TOKEN")
        print_result "DELETE /api/favorites/:id" "$STATUS" "200"
    else
        echo -e "${YELLOW}⚠ SKIP${NC} - DELETE /api/favorites/:id (No favorite ID)"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC} - Favorites endpoints (No access token)"
fi

# ============================================
# PRICE ALERTS ENDPOINTS (4)
# ============================================
echo -e "\n${BLUE}━━━ Price Alerts Endpoints (4) ━━━${NC}\n"

if [ -n "$ACCESS_TOKEN" ]; then
    # 1. Get Alerts
    STATUS=$(test_endpoint "GET" "/api/price-alerts" "" "$ACCESS_TOKEN")
    print_result "GET /api/price-alerts" "$STATUS" "501"

    # 2. Create Alert
    ALERT_DATA='{"type":"hotel","destination":"Paris","targetPrice":100}'
    STATUS=$(test_endpoint "POST" "/api/price-alerts" "$ALERT_DATA" "$ACCESS_TOKEN")
    print_result "POST /api/price-alerts" "$STATUS" "501"

    # 3. Update Alert
    UPDATE_ALERT='{"targetPrice":90}'
    STATUS=$(test_endpoint "PATCH" "/api/price-alerts/alert_123" "$UPDATE_ALERT" "$ACCESS_TOKEN")
    print_result "PATCH /api/price-alerts/:id" "$STATUS" "501"

    # 4. Delete Alert
    STATUS=$(test_endpoint "DELETE" "/api/price-alerts/alert_123" "" "$ACCESS_TOKEN")
    print_result "DELETE /api/price-alerts/:id" "$STATUS" "501"
else
    echo -e "${YELLOW}⚠ SKIP${NC} - Price alerts endpoints (No access token)"
fi

# ============================================
# AFFILIATE ENDPOINTS (13)
# ============================================
echo -e "\n${BLUE}━━━ Affiliate Endpoints (13) ━━━${NC}\n"

# 1. Dashboard
STATUS=$(test_endpoint "GET" "/api/affiliate/dashboard" "" "")
print_result "GET /api/affiliate/dashboard" "$STATUS" "200"

# 2. Referral Tree
STATUS=$(test_endpoint "GET" "/api/affiliate/referral-tree" "" "")
print_result "GET /api/affiliate/referral-tree" "$STATUS" "200"

# 3. Stats
STATUS=$(test_endpoint "GET" "/api/affiliate/stats" "" "")
print_result "GET /api/affiliate/stats" "$STATUS" "200"

# 4. Register as Affiliate
AFF_REG_DATA='{"userId":"user_123"}'
STATUS=$(test_endpoint "POST" "/api/affiliate/register" "$AFF_REG_DATA" "")
print_result "POST /api/affiliate/register" "$STATUS" "200"

# 5. Validate Code
STATUS=$(test_endpoint "GET" "/api/affiliate/validate/REF123456" "" "")
print_result "GET /api/affiliate/validate/:code" "$STATUS" "200"

# 6. Get Earnings
STATUS=$(test_endpoint "GET" "/api/affiliate/earnings" "" "")
print_result "GET /api/affiliate/earnings" "$STATUS" "200"

# 7. Get Referrals
STATUS=$(test_endpoint "GET" "/api/affiliate/referrals" "" "")
print_result "GET /api/affiliate/referrals" "$STATUS" "200"

# 8. Get Payouts
STATUS=$(test_endpoint "GET" "/api/affiliate/payouts" "" "")
print_result "GET /api/affiliate/payouts" "$STATUS" "200"

# 9. Request Payout
PAYOUT_DATA='{"amount":100,"method":"bank_transfer"}'
STATUS=$(test_endpoint "POST" "/api/affiliate/payouts/request" "$PAYOUT_DATA" "")
print_result "POST /api/affiliate/payouts/request" "$STATUS" "200"

# 10. Get Links
STATUS=$(test_endpoint "GET" "/api/affiliate/links" "" "")
print_result "GET /api/affiliate/links" "$STATUS" "200"

# 11. Track Click
CLICK_DATA='{"referralCode":"REF123456","source":"email"}'
STATUS=$(test_endpoint "POST" "/api/affiliate/track-click" "$CLICK_DATA" "")
print_result "POST /api/affiliate/track-click" "$STATUS" "200"

# 12. Get Settings
STATUS=$(test_endpoint "GET" "/api/affiliate/settings" "" "")
print_result "GET /api/affiliate/settings" "$STATUS" "200"

# 13. Update Settings
SETTINGS_DATA='{"paymentMethod":"paypal","notifications":{"email":true}}'
STATUS=$(test_endpoint "PUT" "/api/affiliate/settings" "$SETTINGS_DATA" "")
print_result "PUT /api/affiliate/settings" "$STATUS" "200"

# ============================================
# ADMIN ENDPOINTS (14)
# ============================================
echo -e "\n${BLUE}━━━ Admin Endpoints (14) ━━━${NC}\n"

# Register admin user
ADMIN_TOKEN=$(register_and_login "$TEST_ADMIN_EMAIL" "$TEST_PASSWORD")

if [ -n "$ADMIN_TOKEN" ]; then
    # 1. Get All Affiliates
    STATUS=$(test_endpoint "GET" "/api/admin/affiliates" "" "$ADMIN_TOKEN")
    print_result "GET /api/admin/affiliates" "$STATUS" "403"

    # 2. Get Single Affiliate
    STATUS=$(test_endpoint "GET" "/api/admin/affiliates/aff_1" "" "$ADMIN_TOKEN")
    print_result "GET /api/admin/affiliates/:id" "$STATUS" "403"

    # 3. Update Affiliate Status
    AFF_STATUS='{"status":"suspended"}'
    STATUS=$(test_endpoint "PATCH" "/api/admin/affiliates/aff_1/status" "$AFF_STATUS" "$ADMIN_TOKEN")
    print_result "PATCH /api/admin/affiliates/:id/status" "$STATUS" "403"

    # 4. Verify Affiliate
    STATUS=$(test_endpoint "PATCH" "/api/admin/affiliates/aff_1/verify" "" "$ADMIN_TOKEN")
    print_result "PATCH /api/admin/affiliates/:id/verify" "$STATUS" "403"

    # 5. Get Commissions
    STATUS=$(test_endpoint "GET" "/api/admin/commissions" "" "$ADMIN_TOKEN")
    print_result "GET /api/admin/commissions" "$STATUS" "403"

    # 6. Approve Commission
    STATUS=$(test_endpoint "PATCH" "/api/admin/commissions/comm_1/approve" "" "$ADMIN_TOKEN")
    print_result "PATCH /api/admin/commissions/:id/approve" "$STATUS" "403"

    # 7. Reject Commission
    REJECT_DATA='{"reason":"Invalid transaction"}'
    STATUS=$(test_endpoint "PATCH" "/api/admin/commissions/comm_1/reject" "$REJECT_DATA" "$ADMIN_TOKEN")
    print_result "PATCH /api/admin/commissions/:id/reject" "$STATUS" "403"

    # 8. Get Payouts
    STATUS=$(test_endpoint "GET" "/api/admin/payouts" "" "$ADMIN_TOKEN")
    print_result "GET /api/admin/payouts" "$STATUS" "403"

    # 9. Process Payout
    STATUS=$(test_endpoint "POST" "/api/admin/payouts/payout_1/process" "" "$ADMIN_TOKEN")
    print_result "POST /api/admin/payouts/:id/process" "$STATUS" "403"

    # 10. Complete Payout
    COMPLETE_DATA='{"transactionId":"txn_123456"}'
    STATUS=$(test_endpoint "PATCH" "/api/admin/payouts/payout_1/complete" "$COMPLETE_DATA" "$ADMIN_TOKEN")
    print_result "PATCH /api/admin/payouts/:id/complete" "$STATUS" "403"

    # 11. Reject Payout
    REJECT_PAYOUT='{"reason":"Insufficient funds"}'
    STATUS=$(test_endpoint "PATCH" "/api/admin/payouts/payout_1/reject" "$REJECT_PAYOUT" "$ADMIN_TOKEN")
    print_result "PATCH /api/admin/payouts/:id/reject" "$STATUS" "403"

    # 12. Get Settings
    STATUS=$(test_endpoint "GET" "/api/admin/settings" "" "$ADMIN_TOKEN")
    print_result "GET /api/admin/settings" "$STATUS" "403"

    # 13. Update Settings
    ADMIN_SETTINGS='{"commissionRates":{"level1":6.0}}'
    STATUS=$(test_endpoint "PUT" "/api/admin/settings" "$ADMIN_SETTINGS" "$ADMIN_TOKEN")
    print_result "PUT /api/admin/settings" "$STATUS" "403"

    # 14. Get Analytics
    STATUS=$(test_endpoint "GET" "/api/admin/analytics" "" "$ADMIN_TOKEN")
    print_result "GET /api/admin/analytics" "$STATUS" "403"

    # 15. Get Top Performers
    STATUS=$(test_endpoint "GET" "/api/admin/analytics/top-performers" "" "$ADMIN_TOKEN")
    print_result "GET /api/admin/analytics/top-performers" "$STATUS" "403"
else
    echo -e "${YELLOW}⚠ SKIP${NC} - Admin endpoints (No admin token)"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     TEST SUMMARY                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}⚠ Pass rate: ${PASS_RATE}%${NC}"
    exit 1
fi
