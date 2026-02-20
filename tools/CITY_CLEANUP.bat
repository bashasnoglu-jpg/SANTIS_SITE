@echo off
REM Santis City OS - Headless Cleanup Protocol
REM Runs the City Manager in headless mode (Python direct execution)

echo [CITY OS] Initializing Headless Mode...
echo [CITY OS] Target: %~dp0..

cd /d "%~dp0.."

echo.
echo [1] GHOST HUNTER (DOM Cleanup)
echo [2] UTF-8 MATRIX (Encoding Fix)
echo [3] ALL PROTOCOLS
echo.

set /p choice="Select Protocol [1-3]: "

if "%choice%"=="1" (
    echo [CITY OS] Launching Ghost Hunter...
    python -c "import asyncio; from city_os import city_manager; asyncio.run(city_manager.execute_protocol('protocol_ghosts'))"
) else if "%choice%"=="2" (
    echo [CITY OS] Launching UTF-8 Matrix...
    python -c "import asyncio; from city_os import city_manager; asyncio.run(city_manager.execute_protocol('protocol_utf8'))"
) else if "%choice%"=="3" (
    echo [CITY OS] Launching FULL CITY CLEANUP...
    python -c "import asyncio; from city_os import city_manager; asyncio.run(city_manager.execute_protocol('protocol_ghosts')); asyncio.run(city_manager.execute_protocol('protocol_utf8'))"
) else (
    echo [CITY OS] Invalid selection.
)

echo.
echo [CITY OS] Operation Complete.
pause
