# ── Stage 1: build ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install ALL deps (devDeps needed for NestJS CLI + TypeScript compile)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and compile
COPY . .
RUN npm run build

# ── Stage 2: production ───────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install ONLY production deps from scratch — no prune risk
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Verify critical runtime modules are present before starting
RUN node -e "require('@nestjs/core'); require('@nestjs/common'); require('typeorm'); console.log('✓ deps verified')"

# Runtime directories
RUN mkdir -p uploads logs && chown -R node:node /app

ENV NODE_ENV=production
EXPOSE 3001
USER node

CMD ["node", "dist/main"]
