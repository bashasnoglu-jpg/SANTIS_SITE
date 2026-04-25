@echo off
echo [*] Ingestion API Detayli Debug Modunda Baslatiliyor (TSX)...
cd apps\ingestion-api
call npx tsx src/index.ts > ..\..\debug_api.log 2>&1
