# Dockerfile for 'web' (Dashboard) - CONTEXT: PROJECT ROOT
FROM node:22-alpine AS base
WORKDIR /app

# Deps Stage
FROM base AS deps
# Copy package files from the 'web' subdirectory
COPY web/package.json web/package-lock.json* ./
# Copy shared package files if needed for dependencies
COPY shared/package.json shared/package-lock.json* ./shared/
RUN npm ci

# Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules # Copy shared node_modules
# Copy source code from 'web' and 'shared' subdirectories
COPY web/. ./
COPY shared ./shared
RUN npm run build

# Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install PM2 globally for process management (for worker)
RUN npm install -g pm2

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/worker.js ./worker.js # Copy the worker script

USER nextjs
EXPOSE 3000
ENV PORT 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]