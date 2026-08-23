# --- STAGE 1: BUILDER ---
FROM node:24-alpine AS builder
WORKDIR /app

# Paket tanımlarını kopyala ve tüm bağımlılıkları yükle (dev dahil)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Kaynak kodları kopyala ve build al
COPY src ./src
RUN npm run build

# [KRİTİK MİMARİ HAMLESİ] Production için #imports yollarını src'den dist'e çevir
RUN node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json')); if(p.imports){ p.imports['#database/*']='./dist/database/*'; p.imports['#domain-schema/*']='./dist/domain-schema/*'; fs.writeFileSync('package.json', JSON.stringify(p, null, 2)); }"

# --- STAGE 2: PRODUCTION RUNNER ---
FROM node:24-alpine AS runner
WORKDIR /app

# Güvenlik: Non-root user kullanımı ve Production ortamı
ENV NODE_ENV=production
ENV PORT=3030

# Sadece gerekli üretim dosyalarını builder'dan çek (Mutasyona uğramış package.json dahil)
COPY --from=builder /app/package*.json ./

# Sadece Production bağımlılıklarını kur (Ultra-hafif imaj)
RUN npm install --omit=dev

# Derlenmiş saf JS dosyalarını al
COPY --from=builder /app/dist ./dist

# Alpine içindeki standart node kullanıcısına geçiş
USER node

EXPOSE 3030

# Uygulamayı Native Node.js ile ateşle
CMD ["node", "dist/index.js"]
