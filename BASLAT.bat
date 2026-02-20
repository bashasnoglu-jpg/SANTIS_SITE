@echo off
echo SANTIS ULTRA SYSTEM BASLATILIYOR...
echo -----------------------------------
echo.

:: 1. Bagimliliklari Kontrol Et
echo [1/3] Kutuphaneler kontrol ediliyor...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo DIKKAT: Bazi kutuphaneler yuklenemedi. Devam ediliyor...
    timeout /t 3
)

:: 2. Sunucuyu Baslat (Yeni Pencerede)
echo [2/3] Sentinel V3 Sunucusu baslatiliyor...
start "Santis Neural Server" cmd /k "python server.py"

:: 3. Paneli Ac
echo [3/3] Admin Paneli aciliyor...
timeout /t 4 >nul
start http://localhost:8000/admin/index.html

echo.
echo ISLEM TAMAMLANDI. PENCEREYI KAPATABILIRSINIZ.
timeout /t 5
exit
