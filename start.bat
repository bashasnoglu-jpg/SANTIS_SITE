@echo off
title Santis Club - Yerel Onizleme Sunucusu
color 0A

echo.
echo  ========================================
echo    SANTIS CLUB - YEREL ONIZLEME
echo    Port: 8080
echo    Adres: http://localhost:8080/tr/index.html
echo  ========================================
echo.

:: Port 8080 mesgulse kapat
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo [!] Port 8080 mesgul, kapatiliyor...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 1 /nobreak >nul
)

echo [*] Sunucu baslatiliyor...
echo [*] Tarayicinizda acin: http://localhost:8080/tr/index.html
echo.
start http://localhost:8080/tr/index.html
node server.js

pause
