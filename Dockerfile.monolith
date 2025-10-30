# WhatsDeX Enhanced Dockerfile
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    redis \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies with better error handling
RUN npm ci --only=production --no-audit --no-fund --prefer-offline || npm ci --only=production

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S whatsdex -u 1001 -G nodejs

# Create necessary directories with proper permissions
RUN mkdir -p logs uploads src/services src/utils \
    && chown -R whatsdex:nodejs /app

# Switch to non-root user
USER whatsdex

# Health check with better command
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose ports
EXPOSE 3000 8080

# Start the application
CMD ["npm", "start"]