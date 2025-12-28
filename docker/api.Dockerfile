FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/battle-engine/package.json ./packages/battle-engine/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build packages
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/battle-engine

# Build API
RUN npm run build --workspace=apps/api

# Production image
FROM base AS runner
WORKDIR /app

# Install OpenSSL and libc for Prisma
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production

# Copy built packages
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/battle-engine/dist ./packages/battle-engine/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/battle-engine/package.json ./packages/battle-engine/

# Copy API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Copy node_modules (from builder to include generated Prisma client)
COPY --from=builder /app/node_modules ./node_modules

# Copy root package.json
COPY package.json ./

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/apps/api/src/main.js"]

