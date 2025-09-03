# WhatsDeX Enhanced Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    redis \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S whatsdex -u 1001

# Create necessary directories
RUN mkdir -p logs uploads src/services src/utils

# Set permissions
RUN chown -R whatsdex:nodejs /app
USER whatsdex

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]