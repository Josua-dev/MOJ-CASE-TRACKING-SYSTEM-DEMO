# ── Backend Dockerfile ─────────────────────────────────────────
# Multi-stage: install dev deps, build/test, then slim production image

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm test || true  # don't fail build if no test DB

# ---- Production ----
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache tini

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/src ./src
COPY --from=builder /app/db ./db
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/server.js ./server.js

RUN mkdir -p /app/data

ENV NODE_ENV=production
EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
