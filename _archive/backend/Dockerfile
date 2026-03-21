# -----------------------------------
# STAGE 1: Builder
# -----------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# -----------------------------------
# STAGE 2: Production Engine
# -----------------------------------
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# The Gateway serves both API and static files from ../
CMD ["node", "src/gateway.js"]
