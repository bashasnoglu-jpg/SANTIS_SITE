/**
 * ============================================================================
 * 👑 SOVEREIGN OS - OMNIVERSE CORE (V18 APEX BACKEND)
 * KOD ADI: THE TACHYONIC BRIDGE
 * MİMARİ: Node.js + Express + Native WebSockets (ws)
 * ============================================================================
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

// 1. STATİK DOSYA SUNUCUSU (Python/LiveServer'ın yerini alır)
// Projenizin kök dizinindeki tüm HTML/CSS/JS/Medya dosyalarını hatasız sunar
app.use('/', express.static(__dirname));

const server = http.createServer(app);

// 2. 🕷️ WEBSOCKET: TANRI MODU (God's Eye) AĞINI KUR
const wss = new WebSocketServer({ noServer: true });

// HTTP'den WebSocket'e Geçiş Protokolü (Tachyonic Handshake)
server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws/god-mode') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy(); // Yetkisiz rotaları acımasızca yok et!
    }
});

// 👁️ KARARGAH (God's Eye) BAĞLANTI YÖNETİMİ
wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`\n🦅 [GOD'S EYE] Başkomutan Karargaha Giriş Yaptı. (IP: ${ip})`);

    // 3. İlk Altın Zerkini Yap (Arayüz bağlandığı an Karargahı selamla)
    ws.send(JSON.stringify({
        type: 'SYSTEM_BOOT',
        payload: { 
            status: 'ABSOLUTE_CONTROL',
            message: 'Omniverse Link Established. Welcome to God Mode, Architect.' 
        }
    }));

    // 4. 🫀 KAOS MOTORU (Live Pulse) - Saniyede 1 organik nabız gönder
    let globalPulse = 347;
    let revenueForecast = 128500;

    const chaosEngine = setInterval(() => {
        globalPulse += Math.floor((Math.random() - 0.4) * 5); // Ziyaretçi dalgalanması
        revenueForecast += Math.floor((Math.random() - 0.2) * 600); // Kasa akışı
        
        const payload = {
            type: 'LIVE_PULSE',
            data: {
                activeGuests: globalPulse,
                revenueForecast: revenueForecast,
                aureliaStatus: 'HUNTING',
                timestamp: Date.now()
            }
        };
        
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(payload));
        }
    }, 1500); // 1.5 Saniyede bir nefes al

    // 5. Cepheden (Aurelia AI'den veya UI'dan) gelen istihbaratı dinle
    ws.on('message', (message) => {
        console.log(`🐺 [CEPHE İSTİHBARATI] HQ Aldı: ${message}`);
    });

    ws.on('close', () => {
        console.log(`🌑 [GOD'S EYE] Karargah Bağlantısı Koptu. Körleşme Yaşanıyor!`);
        clearInterval(chaosEngine);
    });
});

// ÇEKİRDEĞİ ATEŞLE
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🍷 SOVEREIGN OMNIVERSE V18 ÇEKİRDEĞİ ATEŞLENDİ`);
    console.log(`⚡ Statik Sunucu: http://localhost:${PORT}`);
    console.log(`👁️ God's Eye Yolu: ws://localhost:${PORT}/ws/god-mode`);
    console.log(`======================================================\n`);
});
