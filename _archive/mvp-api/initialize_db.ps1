# ==============================================================================
# SANTIS MASTER OS - PostgreSQL Native Initialization Script
# Run this from PowerShell AFTER installing PostgreSQL for Windows
# ==============================================================================

# 1. Ensure the PostgreSQL bin directory is in your PATH.
# If you get "psql is not recognized", you may need to run this first (Change version if not 16):
# $env:Path += ";C:\Program Files\PostgreSQL\18\bin"
# $env:Path += ";C:\Program Files\PostgreSQL\16\bin"

Write-Host ">>> Initiating Santis Core Database Creation..." -ForegroundColor Cyan

# 2. Create the Database (You will be prompted for your postgres password)
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres santis
if ($LASTEXITCODE -ne 0) {
    & "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres santis
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Database 'santis' might already exist or psql path is missing." -ForegroundColor Yellow
    }
}

Write-Host ">>> Database Created. Injecting Santis DNA (schema.sql)..." -ForegroundColor Cyan

# 3. Inject the Schema (Absolute Path to the schema file)
$SchemaPath = "C:\Users\tourg\Desktop\SANTIS_SITE\backend\src\database\schema.sql"

& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d santis -f $SchemaPath
if ($LASTEXITCODE -ne 0) {
    & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d santis -f $SchemaPath
}

Write-Host ">>> Injection Complete. The Santis Engine is now physically grounded." -ForegroundColor Green
Write-Host ">>> Next Step: Ensure your server.js is pointing to Database: 'santis', User: 'postgres', and your chosen Password." -ForegroundColor Cyan
