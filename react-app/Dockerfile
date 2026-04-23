# =============================================================================
# AIP-PIR Frontend — React/Vite build → Nginx
# =============================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# VITE_API_URL is baked into the static bundle at build time.
# Set this to the URL browsers will use to reach the backend.
# e.g. http://192.168.1.100:3001 or https://api.yourdomain.com
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_RECAPTCHA_SITE_KEY=
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY

COPY react-app/package.json react-app/package-lock.json* ./
RUN npm ci

COPY react-app/ ./
RUN mkdir -p /docs/wiki/user-guides
COPY docs/SYSTEM_DOCUMENTATION_THESIS.md /docs/SYSTEM_DOCUMENTATION_THESIS.md
COPY docs/wiki/user-guides/Getting-Started.md /docs/wiki/user-guides/Getting-Started.md
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY react-app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
