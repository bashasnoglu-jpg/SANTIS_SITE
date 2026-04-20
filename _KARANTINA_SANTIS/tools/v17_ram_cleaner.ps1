param (
    [switch]$ClearZombies = $false,
    [string]$FilterCategory = "all"
)

Write-Host "🦅 V17 QUANTUM RAM SCANNER & ZOMBIE PURGE PROTOCOL 🦅" -ForegroundColor Cyan

# 1. Get Chrome DevTools Protocol Targets
$uri = "http://127.0.0.1:9222/json"
try {
    $targets = Invoke-RestMethod -Uri $uri -ErrorAction Stop
}
catch {
    Write-Host "❌ CHROME CDP BAĞLANTISI YOK! Port 9222 kapalı." -ForegroundColor Red
    Write-Host "Not: Chrome halihazırda açıksa, yeni bir pencerede debug portu aktif olmaz." -ForegroundColor Yellow
    Write-Host "Lütfen aşağıdaki yalıtılmış profil komutunu deneyin:" -ForegroundColor Yellow
    Write-Host "Start-Process `"chrome.exe`" `"--remote-debugging-port=9222 --user-data-dir=`"C:\temp\chrome-v17-debug`" http://localhost:8000/tr/hamam/index.html`""
    exit 1
}

# 2. Find the V17 Target Page (localhost:8000/tr/hamam vs)
$santisPage = $targets | Where-Object { $_.url -match "localhost:8000" -and $_.type -eq "page" } | Select-Object -First 1

if (-not $santisPage) {
    Write-Host "⚠️ 'localhost:8000' sekmesi bulunamadı! Kuantum Kapısı zorla açılıyor..." -ForegroundColor Yellow
    $newTabUri = "http://127.0.0.1:9222/json/new?http://localhost:8000/tr/hamam/index.html"
    try {
        $santisPage = Invoke-RestMethod -Uri $newTabUri -Method PUT
        Write-Host "⏳ Sayfa yükleniyor, Kuantum Kordonu bekleniyor..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 3 # Wait for the page engine to boot
    }
    catch {
        Write-Host "❌ Yeni sekme açılamadı." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Hedef Kilitlendi: $($santisPage.title) ($($santisPage.url))" -ForegroundColor Green

# 3. Web Socket Connection to the Page
$wsUrl = $santisPage.webSocketDebuggerUrl

# PowerShell'den WebSocket'e saf JSON atmak için yardımcı bir C# sınıfı derleyelim veya daha basit bir HTTP /json/new kullanabiliriz.
# CDP 1.3 destekli tarayıcılarda Runtime.evaluate için WebSocket gereklidir.
# Geçici bir çözüm olarak, PowerShell üzerinden WebSocket açıp mesaj sarmak için ufak bir .NET Client kullanıyoruz.

try {
    Add-Type -AssemblyName System.Net.WebSockets.Client -ErrorAction Stop
}
catch {}
$ws = [System.Net.WebSockets.ClientWebSocket]::new()  
$ct = [System.Threading.CancellationToken]::None  
$connectTask = $ws.ConnectAsync($wsUrl, $ct)  
$connectTask.Wait()  

if ($ws.State -ne 'Open') {
    Write-Host "❌ WebSocket bağlantısı kurulamadı!" -ForegroundColor Red
    exit 1
}

Write-Host "🔗 Kuantum Köprüsü Kuruldu (Zero-GC Comm-Link Active)" -ForegroundColor DarkGray

# 4. Payload Hazırlığı (V17 RAM'i Sorgulama)
$jsCode = ""
if ($ClearZombies) {
    Write-Host "💀 Zombi Node'ları İmha Protokolü Başlatılıyor..." -ForegroundColor Red
    $jsCode = @"
        (function() {
            if (window.SovereignEngineInstance) {
                try {
                    window.SovereignEngineInstance.applyCategoryFilter('$FilterCategory');
                    return 'SUCCESS: V17 Zombi Karatalar temizlendi. Filtre: $FilterCategory';
                } catch(e) {
                    let methods = [];
                    let proto = Object.getPrototypeOf(window.SovereignEngineInstance);
                    if (proto) methods = Object.getOwnPropertyNames(proto);
                    return 'ERROR: ' + e.toString() + ' | Mevcut Metotlar: ' + methods.join(', ');
                }
            } else {
                return 'ERROR: SovereignEngineInstance bellekte bulunamadı.';
            }
        })();
"@

}
else {
    Write-Host "🔍 V17 RAM Pool Analizi Yapılıyor..." -ForegroundColor Yellow
    $jsCode = @"
        if (window.SovereignEngineInstance) {
            JSON.stringify({
                status: 'ONLINE',
                totalCards: window.SovereignEngineInstance.totalCards || 0,
                memoryPoolSize: window.SovereignEngineInstance.pool ? window.SovereignEngineInstance.pool.length : 0,
                cardsInRAM: window.SovereignEngineInstance.data ? window.SovereignEngineInstance.data.length : 0
            });
        } else {
            'NULL_ENGINE';
        }
"@
}

$message = @{
    id     = 1
    method = "Runtime.evaluate"
    params = @{
        expression    = $jsCode
        returnByValue = $true
    }
}

$jsonBody = $message | ConvertTo-Json -Depth 5 -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
$arraySegment = [System.ArraySegment[byte]]::new($bytes)

# Gönder
$sendTask = $ws.SendAsync($arraySegment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct)
$sendTask.Wait()

# Yanıt bekle
$buffer = New-Object byte[] 4096
$segment = [System.ArraySegment[byte]]::new($buffer)
$receiveTask = $ws.ReceiveAsync($segment, $ct)
$receiveTask.Wait()

$responseJson = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $receiveTask.Result.Count)
$responseObj = $responseJson | ConvertFrom-Json

# 5. Sonuçları İncele
if ($responseObj.result.result.type -eq "string") {
    $val = $responseObj.result.result.value
    if ($val -eq "NULL_ENGINE") {
        Write-Host "⚠️ Uyarı: Bu sayfada SovereignEngineInstance aktif değil." -ForegroundColor Yellow
    }
    elseif ($val -match "ERROR") {
        Write-Host "❌ $val" -ForegroundColor Red
    }
    else {
        # Eğer JSON ise parse et, string ise bastır
        try {
            $parsed = $val | ConvertFrom-Json
            Write-Host "`n==== V17 RAM REPORT ====" -ForegroundColor Cyan
            Write-Host "Engine Status : $($parsed.status)"
            Write-Host "Memory Pool   : $($parsed.memoryPoolSize) Nodes"
            Write-Host "Rendered Cards: $($parsed.totalCards)"
            Write-Host "Items in RAM  : $($parsed.cardsInRAM)"
            Write-Host "========================" -ForegroundColor Cyan
        }
        catch {
            Write-Host "💥 SİSTEM YANITI: $val" -ForegroundColor Green
            Set-Content -Path "_purge_result.txt" -Value $val -Encoding utf8
        }
    }
}
else {
    Write-Host "🚨 V17 MOTOR HATASI DETAYI:" -ForegroundColor Red
    Write-Host $responseJson -ForegroundColor DarkYellow
}

# Kapat
$ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait()
Write-Host "🔌 Köprü Kapatıldı." -ForegroundColor DarkGray
