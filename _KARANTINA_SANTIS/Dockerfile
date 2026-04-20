# Sovereign V18 Production Turbine
FROM node:20-alpine AS builder

WORKDIR /app

# Sadece backend bağımlılıklarını kur (hızlı önbellek)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Tüm projeyi kopyala (Frontend + Backend)
COPY . .

# Final imajı
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app /app

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Sovereign Gateway'i Başlat
CMD ["node", "backend/src/gateway.js"]
