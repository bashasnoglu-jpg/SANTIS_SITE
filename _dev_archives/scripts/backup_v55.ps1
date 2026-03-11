$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = "SantisV5.5_Backup_$Timestamp"

Write-Host "🚀 Santis OS V5.5 Full Backup Initializing..."
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# 1. Databases
Write-Host "📦 Backing up SQLite Databases..."
$dbPath = "$BackupDir\db"
New-Item -ItemType Directory -Force -Path $dbPath | Out-Null
Copy-Item "santis_core.db" -Destination $dbPath -ErrorAction SilentlyContinue
Copy-Item "santis_cms.db" -Destination $dbPath -ErrorAction SilentlyContinue

# 2. Frontend Reactivity Core
Write-Host "🌐 Backing up Headless Reactivity Engine (JS Core)..."
$jsPath = "$BackupDir\assets\js\core"
New-Item -ItemType Directory -Force -Path $jsPath | Out-Null
Copy-Item "assets\js\core\*" -Destination $jsPath -Recurse

Copy-Item "assets\js\app-core.js" -Destination "$BackupDir\assets\js" -ErrorAction SilentlyContinue
Copy-Item "assets\js\loaders\data-bridge.js" -Destination "$BackupDir\assets\js\loaders" -Force -ErrorAction SilentlyContinue

# 3. Backend Logic (FastAPI App)
Write-Host "⚙️ Backing up Backend Logic..."
$appPath = "$BackupDir\app"
Copy-Item "app" -Destination $appPath -Recurse
Copy-Item "server.py" -Destination $BackupDir

# 4. Reports and Notes
Write-Host "📄 Backing up E2E Reports and Release Notes..."
Copy-Item "V5.5_RELEASE_NOTES.md" -Destination $BackupDir
Copy-Item "santis-e2e-report-v2.json" -Destination $BackupDir

Write-Host "✅ Backup successfully created at: $BackupDir"
Write-Host "Don't forget to push the tag to Git: git tag -a v5.5 -m 'Santis OS V5.5 Complete'"
