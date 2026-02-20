@echo off

cd /d "%~dp0\.."

color 0b

echo ==================================================

echo   SANTIS YONETIM PANELI BASLATILIYOR

echo ==================================================

echo.

echo 1. Sunucu (Bridge) aciliyor...

start "Santis Server" python server.py



echo.

echo 2. Baglanti kuruluyor (5 saniye)...

timeout /t 5 >nul



echo.

echo 3. Panel tarayicida aciliyor...

start http://localhost:8000/admin/index.html



echo.

echo BASARILI! Bu pencereyi kapatabilirsiniz.

exit

