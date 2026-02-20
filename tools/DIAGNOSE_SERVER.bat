@echo off
echo ==================================================
echo SANTIS SERVER DIAGNOSTIC TOOL
echo ==================================================
echo.
echo 1. Checking Python version...
python --version
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python.
    echo.
    goto end
)

echo.
echo 2. Starting Server (CTRL+C to stop)...
python live-server.py

if %errorlevel% neq 0 (
    echo.
    echo [CRITICAL ERROR] Server crashed! See error message above.
)

:end
echo.
echo ==================================================
pause
