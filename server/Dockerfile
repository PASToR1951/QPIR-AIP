# =============================================================================
# AIP-PIR Backend — Deno 2 + Prisma
# =============================================================================
FROM denoland/deno:2.4.1 AS deno-bin

FROM node:20-bookworm

# Prisma uses Node/npm. The app runtime is Deno.
COPY --from=deno-bin /usr/bin/deno /usr/local/bin/deno

WORKDIR /app

# ── Node dependencies (Prisma, etc.) ─────────────────────────────────────────
COPY package.json package-lock.json* ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci

# ── Prisma client generation ──────────────────────────────────────────────────
COPY prisma/ ./prisma/
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pir_system?schema=public"
RUN npx prisma generate
# Keep the Prisma CLI in the runtime image. The container entrypoint runs
# migrations on startup, so pruning dev dependencies would make `npx prisma`
# unavailable or force a runtime network fetch.

# ── Deno config ───────────────────────────────────────────────────────────────
COPY deno.json deno.lock ./

# ── Source code ───────────────────────────────────────────────────────────────
COPY server.ts prisma.config.ts ./
COPY routes/ ./routes/
COPY db/ ./db/
COPY lib/ ./lib/
COPY types/ ./types/
RUN mkdir -p ./backups/hourly ./backups/daily ./backups/triggers ./public/school-logos ./public/cluster-logos ./public/app-logo

# ── Pre-cache Deno dependencies ───────────────────────────────────────────────
RUN deno cache --node-modules-dir server.ts

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
