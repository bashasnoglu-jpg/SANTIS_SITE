@echo off
title SANTIS MASTER OS
cd /d "C:\Users\tourg\Desktop\SANTIS_SITE"

echo.
echo  ============================================
echo   SANTIS MASTER OS v9.2 - Sovereign Edition
echo  ============================================
echo.

:: Port 8000'de calisan eski process varsa oldur
echo  [0/2] Port 8000 temizleniyor...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000 " ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: PostgreSQL baslatiliyor
echo  [1/2] PostgreSQL baslatiliyor...
set "PATH=%PATH%;C:\Program Files\PostgreSQL\18\bin"
set "PGPASSWORD=santis1234"
pg_ctl start -D "C:\Program Files\PostgreSQL\18\data" -l "C:\Users\tourg\pg.log" -s -w 2>nul
if %errorlevel% equ 0 (
    echo  [OK] PostgreSQL baslatildi.
) else (
    echo  [OK] PostgreSQL zaten calisiyor.
)

echo.
echo  [2/2] Backend baslatiliyor...
echo  [*] API        : http://localhost:8000
echo  [*] Admin Panel: http://localhost:8000/admin/login.html
echo  [*] TR Site    : http://localhost:8000/tr/index.html
echo  [*] Dashboard  : http://localhost:8000/admin/index.html
echo.
echo  Durdurmak icin Ctrl+C basin.
echo  ============================================
echo.

"C:\Users\tourg\Desktop\SANTIS_SITE\venv\Scripts\python.exe" -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
pause
