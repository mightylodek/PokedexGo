FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (using npm install for development to handle lock file updates)
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared package
RUN npm run build --workspace=packages/shared

# Build Next.js app
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy root package.json for workspace support
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./

# Copy built packages
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Copy Next.js app
# For development, we use volume mounts, so we don't need to copy the built files
# If standalone mode is enabled, uncomment the next line:
# COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# Note: public directory is handled by Next.js if it exists

WORKDIR /app/apps/web

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

