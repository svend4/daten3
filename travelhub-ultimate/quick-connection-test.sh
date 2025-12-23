#!/bin/bash

# Quick Connection Test Script
# Быстрая проверка подключения к backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
PROD_URL="https://daten3-1.onrender.com"
TIMEOUT=10

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🔗 Quick Connection Test${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to test URL
test_url() {
    local url=$1
    local label=$2

    echo -e "${YELLOW}Testing ${label}...${NC}"
    echo -e "  URL: ${url}"

    # Test health endpoint
    if curl -s --max-time $TIMEOUT "${url}/api/health" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Health check: PASS${NC}"
    else
        echo -e "  ${RED}❌ Health check: FAIL${NC}"
        return 1
    fi

    # Test root endpoint
    if curl -s --max-time $TIMEOUT "${url}/" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Root endpoint: PASS${NC}"
    else
        echo -e "  ${RED}❌ Root endpoint: FAIL${NC}"
        return 1
    fi

    echo -e "  ${GREEN}✅ ${label} is responding!${NC}"
    echo ""
    return 0
}

# Parse arguments
TEST_LOCAL=false
TEST_PROD=false

if [ $# -eq 0 ]; then
    TEST_LOCAL=true
    TEST_PROD=true
else
    while [ $# -gt 0 ]; do
        case "$1" in
            --local)
                TEST_LOCAL=true
                ;;
            --prod)
                TEST_PROD=true
                ;;
            --help)
                echo "Usage: $0 [--local] [--prod] [--help]"
                echo ""
                echo "Options:"
                echo "  --local   Test local backend (http://localhost:3000)"
                echo "  --prod    Test production backend (https://daten3-1.onrender.com)"
                echo "  --help    Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0              # Test both local and production"
                echo "  $0 --local      # Test only local backend"
                echo "  $0 --prod       # Test only production backend"
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
        shift
    done
fi

# Run tests
FAILED=0

if [ "$TEST_LOCAL" = true ]; then
    test_url "$BACKEND_URL" "Local Backend" || FAILED=$((FAILED + 1))
fi

if [ "$TEST_PROD" = true ]; then
    test_url "$PROD_URL" "Production Backend" || FAILED=$((FAILED + 1))
fi

# Summary
echo -e "${BLUE}================================${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  $FAILED test(s) failed${NC}"
    exit 1
fi
