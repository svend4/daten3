# Multi-stage build for TravelHub Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build tools like Vite)
# Explicitly set NODE_ENV to development to ensure devDependencies are installed
ENV NODE_ENV=development
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
# Render.com passes envVars as Docker build args
ARG VITE_API_BASE_URL=http://localhost:3000/api

# Create .env file for Vite to read during build
# This ensures the environment variable is properly passed to Vite
# Keep NODE_ENV=development for build to ensure all dependencies are available
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env && \
    echo "=== Build Configuration ===" && \
    cat .env && \
    npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Set environment
ENV NODE_ENV=production

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
