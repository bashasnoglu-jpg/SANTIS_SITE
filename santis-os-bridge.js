import { WebSocketServer } from 'ws';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// ==========================================
// 🛡️ SANTIS OS GUARD LAYER v1.0
// ==========================================

const WSS_PORT = 8081;
const wss = new WebSocketServer({ port: WSS_PORT });

console.log(`\n👑 [SANTIS KERNEL] OS Bridge Layer Aktif. Tünel Portu: ${WSS_PORT}`);
console.log(`🛡️  [SECURITY GUARD] Maksimum Güvenlik Kalkanı Onaylandı.\n`);

const GuardPolicy = {
    // Kara Liste: OS Seviyesinde Kritik Çöküş Yaratabilecek Tokens
    FORBIDDEN_TOKENS: /[;&|><$`\\]/g,
    FORBIDDEN_WORDS: /\b(rm|del|Remove|Drop|Format|Stop-Process\s+-Name\s+explorer|Invoke|Set-|New-|Clear-|Restart-|Suspend-)\b/i,

    // İzinli Pasif Eylemler: "Get-", "Test-" gibi OS'i değiştirmeyen sorgular
    SAFE_PREFIXES: /^(Get-|Test-|Show-|Measure-)/i
};

// ==========================================
// 🧠 SEMANTIC COMMAND TRANSLATOR (v1.0)
// ==========================================

function translate(command) {
    // Sabit Niyetler (Açık İzinli)
    const exactMap = {
        "zombie kill chrome": "Stop-Process -Name chrome -Force",
        "zombie kill edge": "Stop-Process -Name msedge -Force",
        "list cpu hogs": "Get-Process | Sort CPU -Desc | Select -First 10",
        "kill dead processes": "Get-Process | Where-Object {$_.Responding -eq $false} | Stop-Process -Force",
        "ping localhost": "Test-Connection localhost -Count 1",
        "memory governor start": "Get-Process | Where-Object {$_.CPU -gt 100 -or $_.Responding -eq $false} | Stop-Process -Force"
    };

    const trimmed = command.trim();
    if (exactMap[trimmed.toLowerCase()]) {
        return exactMap[trimmed.toLowerCase()];
    }

    // 🛡️ GÜVENLİK FİLTRESİ DEVREDE
    // Eğper komut map'te yoksa, PowerShell komutu deniyor demektir.
    return applyGuardLayer(trimmed);
}

function applyGuardLayer(rawCommand) {
    if (!rawCommand) return null;

    // 1. ZEHİRLİ KARAKTER/KELİME TARAMASI
    if (GuardPolicy.FORBIDDEN_TOKENS.test(rawCommand) || GuardPolicy.FORBIDDEN_WORDS.test(rawCommand)) {
        console.warn(`🛑 [OS GUARD BLOCK] Tehlikeli Token Enjeksiyonu Yakalandı: ${rawCommand}`);
        return "OS_SECURITY_VIOLATION";
    }

    // 2. READ-ONLY BYPASS (İzinli Ama Kontrollü)
    if (GuardPolicy.SAFE_PREFIXES.test(rawCommand)) {
        console.log(`🟢 [OS GUARD PASS] Pasif (Read-Only) komuta izin verildi: ${rawCommand}`);
        return rawCommand;
    }

    // Bilinmeyen / Güvensiz
    console.warn(`⚠️ [OS GUARD REJECT] Yetkisiz/Tanımlanmayan Komut Niyeti: ${rawCommand}`);
    return null;
}

// ==========================================
// ⚡ EXECUTION ENGINE
// ==========================================

async function runPowerShell(cmd) {
    if (cmd === "OS_SECURITY_VIOLATION") {
        return Promise.reject("SECURITY VIOLATION: Execution Blocked by Santis OS Guard Layer.");
    }
    
    // Güvenlik bayraklarıyla PowerShell env
    const options = {
        windowsHide: true,
        timeout: 10000 // Maksimum 10 sn infaz süresi
    };

    try {
        const { stdout, stderr } = await execPromise(`powershell -NoProfile -NonInteractive -Command "${cmd}"`, options);
        if (stderr && stderr.trim() !== '') {
            return `[Warning/Error Output]\n${stderr.trim()}`;
        }
        return stdout.trim() || "[SUCCESS] No output generated.";
    } catch (err) {
        return Promise.reject(err.stderr || err.message || "Unknown OS execution fault.");
    }
}

// ==========================================
// 📡 WEBSOCKET HANDLER
// ==========================================

wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`🔌 [WS] Browser Kernel Bağlandı (IP: ${ip}). Yüzey tünel entegrasyonu tamam.`);

    ws.on("message", async (msg) => {
        let incoming;
        try {
            incoming = msg.toString();
            console.log(`\n📥 [KERNEL RAW] Byte Stream Alındı: ${incoming.substring(0, 50)}...`);

            // ⚡ Protocol Uyumluluğu: Eğer SantisStreamProtocol'den (JSON channel/payload) geliyorsa çöz
            if (incoming.startsWith('{')) {
                const parsed = JSON.parse(incoming);
                if (parsed.channel === 'OS_COMMAND' && parsed.payload) {
                    incoming = parsed.payload;
                } else if (parsed.type === "ping" || incoming === "ping") {
                    ws.send("pong"); return;
                }
            }
        } catch(e) { 
            console.warn("⚠️ [WS PARSE ERROR]", e);
            return; 
        }

        if (incoming === "ping") { ws.send("pong"); return; }
        const sysCommand = translate(incoming);

        if (!sysCommand) {
            ws.send("ERROR: UNKNOWN_ACTION_OR_REJECTED");
            return;
        }

        if (sysCommand === "OS_SECURITY_VIOLATION") {
            ws.send("ERROR: OS_SECURITY_VIOLATION (Guard Layer Activated)");
            return;
        }

        try {
            console.log(`⚔️  [OS LAYER] Executing: ${sysCommand}`);
            const result = await runPowerShell(sysCommand);
            // Sonuçları chunk'lar halinde veya tek batch atabiliriz. (1MB max varsayalım)
            const payload = JSON.stringify({ type: "OS_RESPONSE", data: result });
            ws.send(payload);
        } catch (err) {
            console.error(`❌ [OS LAYER FAILED] ${err}`);
            ws.send(JSON.stringify({ type: "OS_ERROR", data: err }));
        }
    });
    
    ws.on('close', () => console.log(`🔌 [WS] Browser Kernel ayrıldı.`));
});
