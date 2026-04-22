FROM node:20-alpine
WORKDIR /app

# ── 1. Install ALL deps (TypeScript / NestJS CLI needed for build) ──
COPY package*.json ./
RUN npm ci --frozen-lockfile

# ── 2. Copy source and compile ──────────────────────────────────────
COPY . .
RUN npm run build

# ── 3. Drop devDependencies from node_modules ───────────────────────
RUN npm prune --production

# ── 4. Sanity-check: fail the BUILD (not the container) if a key dep
#       is missing so the error shows in Railway build logs, not runtime.
RUN node -e "require('@nestjs/core'); require('@nestjs/common'); require('typeorm')" \
    && echo "✓ production node_modules verified"

# ── 5. Runtime setup ────────────────────────────────────────────────
RUN mkdir -p uploads logs

ENV NODE_ENV=production
EXPOSE 3001
USER node

CMD ["node", "dist/main"]
