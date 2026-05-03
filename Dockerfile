# Sovereign Production Turbine v2.1
# Optimized for pnpm Monorepo and Zero-Jank deployment

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Use pnpm deploy to isolate the ingestion-api and its production dependencies
RUN pnpm --filter=@santis/ingestion-api --prod deploy /prod/ingestion-api

# Production Runner
FROM node:20-slim AS runner
WORKDIR /app

# Enable corepack and install runtime TS engines globally
RUN corepack enable && pnpm add -g ts-node typescript

# Copy the standalone deployment bundle
COPY --from=builder /prod/ingestion-api ./

ENV NODE_ENV=production
ENV PORT=3030

EXPOSE 3030

# Sovereign Ingestion API'yi Başlat
# We use ts-node-esm for direct execution of TS files in production
CMD ["ts-node-esm", "src/index.ts"]
