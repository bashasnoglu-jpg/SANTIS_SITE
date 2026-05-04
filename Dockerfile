# Sovereign Production Turbine v3.0
# Production runtime executes compiled JavaScript only.

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Build the ingestion API into dist/ before creating the deploy bundle.
RUN pnpm --filter=@santis/ingestion-api build

# Use pnpm deploy to isolate the ingestion-api and its production dependencies
RUN pnpm --filter=@santis/ingestion-api --prod deploy /prod/ingestion-api
RUN cp -R /app/apps/ingestion-api/dist /prod/ingestion-api/dist

# Production Runner
FROM node:20-slim AS runner
WORKDIR /app

# Copy the standalone deployment bundle
COPY --from=builder /prod/ingestion-api ./

ENV NODE_ENV=production
ENV PORT=3030

EXPOSE 3030

# Sovereign Ingestion API'yi compiled production bundle'dan başlat.
CMD ["node", "dist/index.cjs"]
