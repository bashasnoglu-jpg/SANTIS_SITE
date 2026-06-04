FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copy lockfile, workspace configs and all package.jsons to preserve cache layers and establish symlinks
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY admin-panel/package.json ./admin-panel/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/sovereign-bus/package.json ./packages/sovereign-bus/package.json
COPY packages/openr/package.json ./packages/openr/package.json
COPY packages/domain-schema/package.json ./packages/domain-schema/package.json
COPY packages/design-system/package.json ./packages/design-system/package.json
COPY packages/ui-tokens/package.json ./packages/ui-tokens/package.json
COPY packages/gravity-ux-engine/package.json ./packages/gravity-ux-engine/package.json
COPY packages/event-dictionary/package.json ./packages/event-dictionary/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter admin-panel build

FROM nginx:1.27-alpine

COPY docker/admin-panel/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/admin-panel/dist /usr/share/nginx/html/admin

# Adjust permissions for non-root runtime environment
RUN touch /var/run/nginx.pid \
  && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html /etc/nginx/conf.d

USER nginx

EXPOSE 8080

