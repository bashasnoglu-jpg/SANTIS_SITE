@echo off
cd /d "%~dp0.."
echo SANTIS BRIDGE VE YONETIM PANEL BASLATILIYOR...
echo CALISMA DIZINI: %CD%
echo.

:: 1. Sunucuyu yeni pencerede baslat
start "Santis Server" python server.py

:: 2. Sunucunun acilmasi icin 5 saniye bekle
timeout /t 5 >nul

:: 3. Tarayiciyi admin panelinde ac
start http://localhost:8000/admin/index.html

exit
