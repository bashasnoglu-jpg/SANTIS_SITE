const WebSocket = require('ws');

// Kuleyi 8081 portunda ayağa kaldır
const wss = new WebSocket.Server({ port: 8081 }, () => {
    console.log('\x1b[36m%s\x1b[0m', '================================================');
    console.log('\x1b[36m%s\x1b[0m', '🗼 SANTIS TOWER [ONLINE]');
    console.log('\x1b[32m%s\x1b[0m', '⚡ V8 OMEGA Orchestrator 8081 portunda dinleniyor...');
    console.log('\x1b[36m%s\x1b[0m', '================================================\n');
});

// ZERO-GARBAGE POLICY: Kendi Kendini İyileştiren Hafıza Yönetimi
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log('\x1b[31m%s\x1b[0m', `💀 [SANTIS-REAPER] Ölü düğüm (Ghost Node) tespit edildi. Bağlantı infaz ediliyor (Drop Policy).`);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000); // Her 30 saniyede bir otonom yoklama

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    const clientId = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log('\x1b[32m%s\x1b[0m', `🔌 [UPLINK ESTABLISHED] Yeni Bilişsel Lob bağlandı: [${clientId}]`);
    
    // Kalp atışı yanıtı
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // Düğümden (Frontend'den) gelen Kuantum Niyetleri ve Basınç Raporları
    ws.on('message', (message) => {
        try {
            const payload = message.toString();
            
            // LOGLAMA: Sadece kritik donanım yangınlarını terminale bas
            if (payload.includes('"type":"PRESSURE_SPIKE"') && payload.includes('"level":2')) {
                console.log('\x1b[31m%s\x1b[0m', `🔥 [CRITICAL] Düğüm [${clientId}] Boğuluyor! Kovan uyarılıyor...`);
            } else if (payload.includes('INTENT')) {
                console.log('\x1b[33m%s\x1b[0m', `💠 [MORPH] Cross-Device Niyet Yakalandı [${clientId}]. Yönlendiriliyor...`);
            }

            // THE QUORUM BROADCAST: Mesajı gönderen HARİÇ tüm bağlı cihazlara anında ilet
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(payload); 
                }
            });
            
        } catch (e) {
            console.error('\x1b[31m%s\x1b[0m', `[TOWER ERROR] Hatalı telemetri paketi reddedildi.`);
        }
    });

    // Cihaz koptuğunda
    ws.on('close', () => {
        console.log('\x1b[35m%s\x1b[0m', `📡 [UPLINK LOST] Düğüm [${clientId}] Kovan'dan ayrıldı.`);
    });
});

wss.on('close', () => {
    clearInterval(interval);
});
