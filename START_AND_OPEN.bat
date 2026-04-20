@echo off
cd /d "%~dp0"

echo Starting Sovereign Server...
start cmd /k "node server.js"

echo Waiting for backend...
timeout /t 3 > nul

echo Starting Admin Panel...
start cmd /k "cd admin-panel && npm run dev"

timeout /t 3 > nul

echo Opening Dashboard...
start http://localhost:5173
