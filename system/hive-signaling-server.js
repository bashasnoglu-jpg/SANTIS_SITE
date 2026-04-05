// hive-signaling-server.js
// SDCR V52.0 OMEGA - WebRTC/WebSocket Hive Mind Relay Server

const WebSocket = require('ws');

// Terminal port belirtilmediyse varsayılan olan 8081 numaralı porttan çalış
const PORT = process.env.PORT || 8081;

// 1. Ağ Geçidini Başlat
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`\x1b[36m%s\x1b[0m`, `🐝 [HIVE NODE] SDCR Omni-Mind Signaling Server Çevrimiçi`);
    console.log(`\x1b[35m%s\x1b[0m`, `📡 Port: ${PORT} üzerinde Sürü dinleniyor... Bekleniyor...`);
});

wss.on('connection', function connection(ws, req) {
    const ip = req.socket.remoteAddress;
    console.log(`\x1b[32m%s\x1b[0m`, `🟢 [HIVE NODE] Yeni bir SDCR Hücresi (Node) Kovan'a bağlandı. [IP: ${ip}]`);

    ws.on('message', function incoming(data) {
        try {
            const rawData = data.toString();
            // Kovanın ritmi: Sadece nabız (Ping/Heartbeat) kontrolü ise işlemden süz ve geç
            if (rawData === 'ping' || rawData === 'HEARTBEAT') return;

            // Gerçek DNA Paketleri
            const packet = JSON.parse(rawData);
            
            if (packet.type === 'ping' || packet.type === 'HEARTBEAT') {
                return; // JSON formatlı nabız kontrolünü gürültüsüz yut
            } else if (packet.type === 'EVOLUTION_DNA' || packet.type === 'SWARM_EXPERIENCE' || packet.type === 'LIQUID_AUTHORITY_SYNC' || packet.type === 'SOUL_MIGRATION') {
                console.log(`\x1b[33m%s\x1b[0m`, `🧬 [HIVE NODE] Sinerji (Broadcast): [${packet.type}]`);
                
                // P2P Broadcast: Gelen mesajı, gönderen hariç TÜM HÜCRELERE fısılda
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(data.toString());
                    }
                });
            } else {
                console.log(`[HIVE NODE] Bilinmeyen paket formatı alındı: ${packet.type}`);
            }
        } catch(e) {
            console.error(`\x1b[31m%s\x1b[0m`, `❌ [HIVE NODE ERROR] Bozuk veya deşifre edilemeyen paket tespit edildi. Engellendi.`);
        }
    });

    ws.on('close', () => {
        console.log(`\x1b[90m%s\x1b[0m`, `🌑 [HIVE NODE] Bir SDCR Hücresi bağlantıyı kesti ve yalnızlığa döndü.`);
    });
    
    ws.on('error', (err) => {
        console.error(`\x1b[31m%s\x1b[0m`, `❌ [HIVE NODE ERROR] Soket çöküşü: ${err.message}`);
    });
});
