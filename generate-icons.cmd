@echo off
cd /d "%~dp0"
echo 🎨 Santis Club Ikon Olusturucu
echo --------------------------------
if not exist "node_modules" (
  echo 📦 Gerekli paketler yukleniyor...
  call npm install
  if errorlevel 1 (
    echo ❌ Paket kurulumu basarisiz.
    exit /b 1
  )
)
echo 🔨 Ikonlar olusturuluyor...
node make-icons.js
if errorlevel 1 (
  echo ❌ Olusturma basarisiz.
  exit /b 1
)
echo.
echo ✅ Islem tamamlandi.
pause
