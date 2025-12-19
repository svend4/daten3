#!/bin/bash

echo "🚀 Starting deployment..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Build backend (if needed)
cd ../travelhub-backend
echo "📦 Building backend..."
npm run build

# Deploy to server (example with rsync)
echo "🌐 Deploying to server..."
rsync -avz --delete dist/ user@server:/var/www/travelhub/

echo "✅ Deployment complete!"
