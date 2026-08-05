FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/ai-review-evidence/package.json services/ai-review-evidence/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY services/ai-review-evidence services/ai-review-evidence
RUN pnpm --filter @santis/ai-review-evidence build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/ai-review-evidence/package.json services/ai-review-evidence/package.json
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
COPY --from=build /app/services/ai-review-evidence/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
