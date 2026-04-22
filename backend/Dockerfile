# ── Stage 1: install all deps + build ────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

# Prune devDependencies in-place so the builder's node_modules
# already contains only production packages for the next stage.
RUN npm prune --production

# ── Stage 2: production runtime ───────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy pre-pruned node_modules from builder — no second npm install needed.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist

# Writable dirs for logs / uploads
RUN mkdir -p uploads logs

USER node

EXPOSE 3001
CMD ["node", "dist/main"]
