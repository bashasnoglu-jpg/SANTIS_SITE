FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY admin-panel/package.json ./admin-panel/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter admin-panel build

FROM nginx:1.27-alpine

COPY docker/admin-panel/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/admin-panel/dist /usr/share/nginx/html

EXPOSE 80
