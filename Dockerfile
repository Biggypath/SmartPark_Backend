# ── Stage 1: Install dependencies & generate Prisma client ────
FROM node:22-alpine AS build

WORKDIR /app

# Copy package manifests first (better layer caching)
COPY package.json package-lock.json* ./

# Install ALL dependencies (dev + prod) — needed for prisma generate
RUN npm ci

# Copy Prisma schema & config so we can generate the client
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

# ── Stage 2: Production image ────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy generated Prisma client from build stage
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# We need tsx at runtime (TypeScript execution without a compile step)
RUN npm install tsx

# Copy application source & Prisma schema (needed at runtime)
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the application port (REST + WebSocket share this port)
EXPOSE 8080

# Health check — hits the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Start the server
ENV NODE_ENV=production
ENV PORT=8080
CMD ["npx", "tsx", "src/app.ts"]
