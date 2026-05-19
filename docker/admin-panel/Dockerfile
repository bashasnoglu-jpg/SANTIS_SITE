# ╔══════════════════════════════════════════════════════╗
# ║  SANTIS OS — Admin Panel Realtime Workspace         ║
# ║  Stage 1: Build static dashboard using pnpm         ║
# ║  Stage 2: Serve optimized assets with Nginx Alpine  ║
# ╚══════════════════════════════════════════════════════╝

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Copy lockfile and package configs
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY admin-panel/package.json ./admin-panel/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy other source code files
COPY . .

# Compile admin panel (Vite builds into /app/admin-panel/dist)
RUN pnpm --filter admin-panel build

# ── Stage 2: Nginx Production Server ──────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

WORKDIR /usr/share/nginx/html

# Secure: run Nginx under non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Copy our custom production-grade Nginx configuration
COPY docker/admin-panel/nginx.conf /etc/nginx/conf.d/default.conf

# Copy admin Vite dist to subpath /usr/share/nginx/html/admin
COPY --from=builder --chown=nginx:nginx /app/admin-panel/dist ./admin

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/admin/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
