@echo off
title Santis Sovereign Server v1.0
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════╗
echo  ║  👑 SANTIS SOVEREIGN SERVER v1.0                  ║
echo  ║  Static + API + WebSocket — Zero Dependencies     ║
echo  ╚═══════════════════════════════════════════════════╝
echo.

:: Port kontrolü - eğer 8080 meşgulse önce onu kapat
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo [!] Port 8080 mesgul, kapatiliyor...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: Sunucuyu başlat
echo [*] Node.js sunucusu baslatiliyor...
echo.
cd /d "%~dp0\.."
node server.js

:: Hata durumunda bekle
if errorlevel 1 (
    echo.
    echo [X] Sunucu hatasi! Node.js yuklu mu kontrol edin.
    echo     Kurulum: https://nodejs.org
    echo.
    pause >nul
)
