# =============================================================================
# QPIR-AIP Backend — Deno 2 + Prisma
# =============================================================================
FROM denoland/deno:2.4.1

# Install Node.js 20 (needed for Prisma client generation and migrations)
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Node dependencies (Prisma, etc.) ─────────────────────────────────────────
COPY package.json ./
RUN npm install

# ── Prisma client generation ──────────────────────────────────────────────────
COPY prisma/ ./prisma/
RUN npx prisma generate

# ── Deno config ───────────────────────────────────────────────────────────────
COPY deno.json deno.lock ./

# ── Source code ───────────────────────────────────────────────────────────────
COPY server.ts prisma.config.ts ./
COPY routes/ ./routes/
COPY db/ ./db/
COPY controllers/ ./controllers/
COPY data/ ./data/

# ── Pre-cache Deno dependencies ───────────────────────────────────────────────
RUN deno cache --node-modules-dir server.ts

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
