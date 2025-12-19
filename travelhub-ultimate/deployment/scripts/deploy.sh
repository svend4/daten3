#!/bin/bash

set -e

echo "🚀 TravelHub Deployment Script"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Building Frontend...${NC}"
cd ../../frontend
npm ci --silent
npm run build

echo -e "${BLUE}📦 Building Backend...${NC}"
cd ../backend
npm ci --silent
npm run build

echo -e "${GREEN}✅ Build Complete!${NC}"
echo "================================"
echo "Ready to deploy to your hosting provider"
echo ""
echo "Next steps:"
echo "1. Frontend: Deploy 'frontend/dist' to Vercel/Netlify"
echo "2. Backend: Deploy 'backend/dist' to Railway/Render"
echo "3. Configure environment variables"
