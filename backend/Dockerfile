# ── Stage 1: build ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

# ── Stage 2: production runtime ───────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev --frozen-lockfile

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Writable dirs for uploads and logs
RUN mkdir -p uploads logs && chown -R node:node .
USER node

EXPOSE 3001
# Railway overrides PORT via env — honour it
CMD ["sh", "-c", "node dist/main"]
