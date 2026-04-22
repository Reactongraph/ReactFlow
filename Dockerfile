# ── Stage 1: build ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .

# VITE_* vars must be present at BUILD time — Railway passes them as build args
ARG VITE_API_URL=http://localhost:3001/api/v1
ARG VITE_WS_URL=http://localhost:3001/ws
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g serve
WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 3000
# Railway injects $PORT at runtime
CMD ["sh", "-c", "serve -s dist --listen tcp://0.0.0.0:${PORT:-3000}"]
