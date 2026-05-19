# SANTIS OS — Phase D: Port SSOT & Env Hygiene Report

> **Status:** SEALED  
> **Date:** 2026-05-09  
> **Commit:** `e5b5f72e`  
> **Tag:** `phase-d-port-ssot-env-hygiene-seal`

---

## 1. Port SSOT Registry

Tüm aktif servislerin port kullanımları aşağıdaki gibi mühürlenmiştir:

| Service | Port | Description |
| :--- | :--- | :--- |
| **Admin Panel** | 8080 | Vite React Application |
| **Ingestion API** | 3030 | Sovereign Bus / Backend |
| **Marketing Site** | 8081 | Static HTML / serve.cjs |
| **Telemetry / Signal** | 4040 | Real-time signaling server (WebSocket) |
| **Legacy API** | 3000 | Fastify Internal API surface |

---

## 2. Environment Hygiene

- **Root `.env.example`**: Port SSOT dökümantasyonu eklendi.
- **`admin-panel/.env.example`**: Hatalı `VITE_CORE_API_URL=8080` çakışması `3030` olarak düzeltildi.
- **`apps/ingestion-api/.env.example`**: İlk kez oluşturuldu ve mühürlendi.
- **Security Check**: Hiçbir gerçek `.env` dosyası repoya dahil edilmedi.

---

## 3. Configuration Consolidation

- **Vite Root**: `vite.config.ts` (port 5500) ve `vite.config.js` (port 5173) birleştirilerek tek yetkili `vite.config.ts` (port 8081) oluşturuldu.
- **MPA Pipeline**: Gelişmiş Multi-Page App derleme mantığı TypeScript tabanlı yeni yapılandırmaya aktarıldı.
- **Serve Utility**: `serve.cjs` varsayılan portu çakışmayı önlemek için `3030`'dan `8081`'e çekildi.

---

## 4. Verification Results

- **Lint:** PASS ✅
- **Stitch Enforce:** PASS ✅
- **E2E Tests:** 24/24 PASS ✅
