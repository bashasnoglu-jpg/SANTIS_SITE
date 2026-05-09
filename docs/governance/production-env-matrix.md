# SANTIS OS — Production Environment Matrix

Bu döküman, SANTIS OS ekosisteminin üretim ortamında (Vercel, Docker, CI) çalışması için gerekli olan kritik çevresel değişkenleri tanımlar.

---

## 1. Frontend & Admin (Vercel)

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `VITE_CORE_API_URL` | Admin | YES | Backend (Ingestion API) base URL (e.g., https://api.santis.club) |
| `VITE_TELEMETRY_WS_URL` | Admin | YES | Telemetry WebSocket URL (e.g., wss://api.santis.club/ws) |
| `ADMIN_SECRET_TOKEN` | Build | YES | Security gate token for telemetry access |

---

## 2. Ingestion API (Docker / Cloud)

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Runtime | YES | PostgreSQL connection string (SSOT: postgres://...) |
| `POSTGRES_PASSWORD` | Infrastructure | YES | DB Master password |
| `ADMIN_SECRET_TOKEN` | Runtime | YES | Shared secret for MFE-to-API communication |
| `NODE_ENV` | Runtime | YES | Must be set to `production` |
| `PORT` | Runtime | NO | Defaults to `3030` |
| `WS_PORT` | Runtime | NO | Defaults to `4040` |

---

## 3. Storage & Third-Party (Future)

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | Storage | NO | S3 Access Key |
| `AWS_SECRET_ACCESS_KEY`| Storage | NO | S3 Secret Key |
| `GEMINI_API_KEY` | AI | NO | AI Orchestration Key |

---

## 📜 Güvenlik Notu

1.  **Secret Management:** Gerçek değerler ASLA repoya commit edilmez. Vercel Dashboard veya Docker Secrets / Environment files (.env.prod) üzerinden yönetilmelidir.
2.  **Rotation:** `ADMIN_SECRET_TOKEN` her major sürümde veya güvenlik şüphesinde yenilenmelidir.
