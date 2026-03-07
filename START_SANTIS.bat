@echo off
title Santis OS - Live Server
echo =======================================================
echo 🦅 THE SOVEREIGN ENGINE IS BOOTING UP...
echo =======================================================
echo.
echo Lutfen acilan tarayici penceresini kullanin.
echo Sunucuyu durdurmak icin bu siyah pencereyi kapatin.
echo.

:: Tarayiciyi otomatik olarak dogru adreste aciyoruz
start http://localhost:8000/tr/rituals/index.html

:: Projenin ana klasorunde (SANTIS_SITE) bir Python HTTP sunucusu baslatiyoruz
python -m http.server 8000
