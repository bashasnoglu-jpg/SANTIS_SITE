// system/santis-hive-nexus.js
// SDCR V60.0 OMEGA - ULTRA-LIGHTWEIGHT TELEMETRY & EVENT NEXUS

const { WebSocketServer } = require('ws');
const crypto = require('crypto');

const PORT = 8081;
// perMessageDeflate: false -> Sıkıştırmayı kapatarak 1ms gecikme (ultra-low latency) sağlar
const wss = new WebSocketServer({ port: PORT, perMessageDeflate: false });

const swarm = new Map();

console.log(`\n🌌 [HIVE NEXUS] Sovereign Event Backend Çevrimiçi.`);
console.log(`📡 Port: ${PORT} | Ultra-low latency pipeline aktif.`);
console.log(`👁️ Organizmaların uyanması bekleniyor...\n`);

wss.on('connection', (ws, req) => {
  const nodeId = crypto.randomUUID().split('-')[0];
  const ip = req.socket.remoteAddress;
  
  swarm.set(nodeId, { ws, ip, lastSeen: Date.now() });
  console.log(`🟢 [UPLINK] Yeni Hücre: [Node-${nodeId}] | Kovan Büyüklüğü: ${swarm.size}`);

  ws.on('message', (message) => {
    const rawData = message.toString().trim();
    const node = swarm.get(nodeId);
    if (node) node.lastSeen = Date.now();

    // 🫀 1. OTONOM SİNİR SİSTEMİ (Solunum Filtresi)
    // Front-end'in "Yaşıyor musun?" sorusunu 0ms'de cevapla, logları kirletme
    if (rawData === 'ping' || rawData === 'HEARTBEAT') {
      ws.send(rawData === 'ping' ? 'pong' : 'HEARTBEAT_ACK');
      return;
    }

    // 🧬 2. KÜRESEL SİNİR AĞI VERİSİ (Mesh Routing)
    try {
      const packet = JSON.parse(rawData);
      
      // Kovan İçi Fısıldaşma (Broadcast)
      // Mesajı gönderen hücre HARİÇ tüm canlı hücrelere ham veriyi yolla
      const payloadString = JSON.stringify(packet);
      for (const [id, peer] of swarm) {
        if (id !== nodeId && peer.ws.readyState === 1 /* OPEN */) {
          peer.ws.send(payloadString);
        }
      }
    } catch (e) {
      console.warn(`⚠️ [NEXUS] Biyolojik Gürültü Reddedildi (Bozuk Doku): ${rawData.substring(0, 30)}...`);
    }
  });

  ws.on('close', () => {
    swarm.delete(nodeId);
    console.log(`🌑 [DOWNLINK] Sinaps Koptu: [Node-${nodeId}] | Kalan Hücre: ${swarm.size}`);
  });
});

// -----------------------------
// 🧹 OTONOM ÇÖP TOPLAYICI (Reaper Protocol)
// -----------------------------
// Her 15 saniyede bir Kovan tüm hücreleri yoklar. Cevap vermeyenlerin fişini çeker.
setInterval(() => {
  const now = Date.now();
  for (const [id, node] of swarm) {
    if (now - node.lastSeen > 35000) { // 35 saniye nabız yoksa
      console.log(`💀 [NEXUS] Nekroz Tespit Edildi. Ölü hücre budanıyor: [Node-${id}]`);
      node.ws.terminate();
      swarm.delete(id);
    }
  }
}, 15000);
