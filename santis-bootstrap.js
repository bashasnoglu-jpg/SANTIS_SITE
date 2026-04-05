// santis-bootstrap.js - THE APEX LOADER & GHOST HUNTER
const { exec, fork } = require('child_process');
const os = require('os');

const PORT = 8081;
const BRIDGE_FILE = './santis-os-bridge.js'; // Asıl sunucu dosyanız

console.log(`\n🌌 [APEX LOADER] Sovereign OS Boot Sequence Initiated...`);

// 1. GHOST HUNTER & SOVEREIGN KILL
const killGhostProcess = () => {
    return new Promise((resolve) => {
        const isWin = os.platform() === 'win32';
        // İşletim sistemine göre port dinleyen PID'yi bulma komutu
        const findCmd = isWin ? `netstat -ano | findstr :${PORT}` : `lsof -i :${PORT} -t`;

        exec(findCmd, (err, stdout) => {
            if (!stdout) {
                console.log(`✅ [GHOST HUNTER] Port ${PORT} tertemiz. Engeller yok.`);
                return resolve();
            }

            // Çıktıdan PID numarasını ayıkla
            let pid;
            if (isWin) {
                const lines = stdout.trim().split('\n');
                const lastLine = lines[lines.length - 1].trim();
                const parts = lastLine.split(/\s+/);
                pid = parts[parts.length - 1]; // Windows'ta PID son sütundadır
            } else {
                pid = stdout.trim().split('\n')[0]; // Unix'te direkt PID döner
            }

            if (!pid) return resolve();

            console.warn(`💀 [GHOST HUNTER] Port ${PORT} işgal altında (PID: ${pid}). İnfaz ediliyor...`);

            // İşletim sistemine göre PID'yi acımasızca katlet
            const killCmd = isWin ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`;
            exec(killCmd, (killErr) => {
                if (killErr) {
                    console.error(`❌ [SOVEREIGN KILL] İnfaz başarısız oldu:`, killErr.message);
                } else {
                    console.log(`🩸 [SOVEREIGN KILL] Zombi süreç (PID: ${pid}) başarıyla yok edildi.`);
                }
                // Portun işletim sistemi tarafından tamamen serbest bırakılması için 1 saniye bekle
                setTimeout(resolve, 1000);
            });
        });
    });
};

// 2. BRIDGE IGNITION (Köprüyü Ateşle)
const igniteBridge = () => {
    console.log(`🚀 [BRIDGE IGNITION] Ana Üs (${BRIDGE_FILE}) ayağa kaldırılıyor...`);
    
    // Köprüyü izole bir alt süreç olarak başlat
    const bridge = fork(BRIDGE_FILE);

    bridge.on('error', (err) => {
        console.error(`💥 [APEX LOADER] Köprü çöktü:`, err);
    });

    bridge.on('exit', (code) => {
        console.warn(`⚠️ [APEX LOADER] Ana Üs kapandı (Çıkış Kodu: ${code}). Sistem uykuya geçiyor.`);
        process.exit(code);
    });
};

// --- EXECUTION AKIŞI ---
killGhostProcess().then(() => igniteBridge());
