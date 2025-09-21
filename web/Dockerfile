# Dockerfile for 'web' (Dashboard) - CONTEXT: PROJECT ROOT
FROM node:18-alpine AS base
WORKDIR /app

# Deps Stage
FROM base AS deps
# Copy package files from the 'web' subdirectory
COPY web/package.json web/package-lock.json* ./
RUN npm ci

# Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy source code from 'web' and 'shared' subdirectories
COPY web/. .
COPY shared ./shared
RUN npm run build

# Runner Stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]