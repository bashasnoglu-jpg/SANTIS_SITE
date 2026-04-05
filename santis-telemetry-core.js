/**
 * ==========================================
 * 👁️ GOD'S EYE PROTOCOL: WEBSOCKET SPINE (V6)
 * ==========================================
 * Kuantum Beynine saniyede 10 kare (100ms) hızında gerçeklik pompalar!
 */
const { WebSocketServer } = require('ws');
const os = require('os');
const express = require('express');

// Express veya HTTP olmadan saf WS kur
const wss = new WebSocketServer({ port: 8081 });
let activeAgents = new Set();

console.log("\n========================================");
console.log("👁️  GOD'S EYE UPLINK ONLINE [PORT: 8081]");
console.log("========================================\n");

wss.on('connection', (ws) => {
    activeAgents.add(ws);
    console.log(`[+] Yeni Ajan Matriks'e bağlandı. Toplam Zihin: ${activeAgents.size}`);

    ws.on('close', () => {
        activeAgents.delete(ws);
        console.log(`[-] Ajan hattan düştü. Toplam Zihin: ${activeAgents.size}`);
    });
});

// ⚡ THE HEARTBEAT: Saniyede 10 atım (100ms) - Görsel Şölen Başlıyor!
setInterval(() => {
    if (activeAgents.size === 0) return; // Dinleyen yoksa enerjiyi koru

    // Gerçek Sistem Verilerini Çek
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMemPct = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);
    
    // Yüksek İvme Simülasyonu: os.loadavg() yavaş güncellendiği için Anomaly Testi amacıyla Jitter ekleniyor
    const baseCpu = (os.loadavg()[0] || 0) * 10; 
    
    // Anomaly testleri için arada sırada "Spike" (patlama) yarat! %1 şansla 95'e fırla.
    let isSpike = Math.random() < 0.05; 
    let dynamicCpu = baseCpu + (Math.random() * 8 - 4);
    if (isSpike) dynamicCpu = 92 + Math.random() * 8; // Spike!
    
    dynamicCpu = Math.min(100, Math.max(0, dynamicCpu)).toFixed(1);

    // Kuantum Ping (Jitter testi için)
    let ping = Math.floor(Math.random() * 8) + 2;
    if (Math.random() < 0.03) ping = Math.floor(Math.random() * 40) + 16; // Ping Jitter!

    const payload = JSON.stringify({
        type: 'GODS_EYE_STREAM',
        data: {
            cpu: dynamicCpu,
            memory: usedMemPct,
            agents: activeAgents.size,
            ping: ping
        }
    });

    // Tüm bağlı ajanlara (sekmelere) vizyonu fırlat
    activeAgents.forEach(client => {
        if (client.readyState === 1) client.send(payload);
    });
}, 100);
