@echo off
color 0b
echo ==========================================
echo   SANTIS CORE OS: KUTUPHANE KURULUMU
echo ==========================================
echo.
echo Gorsel motoru (Curator) icin Pillow yukleniyor...
echo Yontem: python -m pip
echo.

python -m pip install --upgrade pip
python -m pip install Pillow

echo.
echo ==========================================
echo   ISLEM TAMAMLANDI!
echo ==========================================
echo Eger yukarida "Successfully installed" yaziyorsa basarilidir.
echo Hata varsa Python kurulumunuzu kontrol edin.
pause
