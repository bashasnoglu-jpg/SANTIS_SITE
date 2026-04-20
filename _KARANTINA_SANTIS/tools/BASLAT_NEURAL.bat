@echo off

title SANTIS NEURAL BRIDGE (v2.1)

color 0A

echo.

echo ===================================================

echo   SANTIS NEURAL ARCHITECTURE - SERVER LAUNCHER

echo ===================================================

echo.

echo [1/3] Temizlik Yapiliyor (Eski sunucular kapatiliyor)...

taskkill /F /IM python.exe /T >nul 2>&1

echo.

echo [2/3] Bagimliliklar Kontrol Ediliyor...

pip install -r requirements.txt >nul 2>&1

echo.

echo [3/3] Neural Bridge (v2.1) Baslatiliyor...

echo.

echo   Lutfen bu pencereyi KAPATMAYIN.

echo   Admin Panelinin ve AI Motorunun calismasi icin bu gereklidir.

echo.

echo   Erisim Adresi: http://localhost:8000/admin/index.html

echo.

python server.py

pause

