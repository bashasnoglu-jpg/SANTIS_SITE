@echo off
echo =======================================================
echo SOVEREIGN DB VAULT - CANLI TEST MODULU
echo =======================================================

echo.
echo [1/3] Veritabani (DB Vault) Semasi Yukleniyor...
cd C:\Users\tourg\Desktop\SANTIS_SITE\packages\db
call npx drizzle-kit push:pg

echo.
echo [2/3] Ingestion API'ye Canli Event (Niyet) Gonderiliyor...
curl -X POST http://localhost:3030/api/events -H "Content-Type: application/json" -d "{\"type\":\"BOOKING_INTENT_CAPTURED\", \"subject\":\"BOOKING\", \"payload\": { \"tenantId\": \"santis-club\", \"userId\":\"11111111-1111-4111-8111-111111111111\", \"intent\":\"Sovereign Hamam\", \"timestamp\": 1710000000000 } }"

echo.
echo.
echo [3/3] DB Vault Mühür Dogrulamasi (Studio Aciliyor)...
call npx drizzle-kit studio
