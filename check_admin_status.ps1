# SantisOS Admin Status Check (Roboz)
Write-Output "🔍 Checking SantisOS Admin Panel Status..."

$url = "http://localhost:8000/admin/index.html"

try {
    # Use BasicParsing to avoid IE engine issues
    $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 5
    
    if ($response.StatusCode -eq 200) {
        Write-Output "✅ STATUS: ONLINE (UP)"
        Write-Output "📍 URL: $url"
        Write-Output "🚀 Server: FastAPI/Python (Port 8000)"
    }
    else {
        Write-Output "⚠️ STATUS: DOWN (Code: $($response.StatusCode))"
    }
}
catch {
    Write-Output "❌ STATUS: UNREACHABLE"
    Write-Output "   Error: $_"
    Write-Output "👉 Make sure 'server.py' is running in another terminal!"
}
