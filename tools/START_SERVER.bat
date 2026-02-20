@echo off
title Santis Neural Bridge Server
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════╗
echo  ║     SANTIS NEURAL BRIDGE V3.0 (Enterprise)        ║
echo  ║     Sunucu Baslatiliyor...                        ║
echo  ╚═══════════════════════════════════════════════════╝
echo.

:: Port kontrolü - eğer 8000 meşgulse önce onu kapat
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo [!] Port 8000 mesgul, kapatiliyor...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: Sunucuyu başlat
echo [*] Python sunucusu baslatiliyor...
echo.
cd /d "%~dp0\.."
python server.py

:: Hata durumunda bekle
if errorlevel 1 (
    echo.
    echo [X] Sunucu hatasi! Cikis icin bir tusa basin...
    pause >nul
)
