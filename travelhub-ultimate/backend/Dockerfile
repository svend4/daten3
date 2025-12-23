# Multi-stage build for TravelHub Backend
FROM node:20-alpine AS builder

# Install dependencies for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install OpenSSL for Prisma and wget for healthcheck
RUN apk add --no-cache openssl wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema BEFORE npm ci (needed for postinstall hook)
COPY prisma ./prisma/

# Install production dependencies only (will run postinstall -> prisma generate)
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy startup scripts
COPY start.js ./
COPY start-render.mjs ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Health check - simple wget/curl check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "run", "start:render"]
