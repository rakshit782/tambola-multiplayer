# Multi-stage Docker build for Tambola Global App
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 tambola

COPY --from=deps --chown=tambola:nodejs /app/node_modules ./node_modules
COPY --chown=tambola:nodejs . .

USER tambola

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
