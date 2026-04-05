/**
 * ==============================================================================
 * SANTIS SDCR - THE BLIND MATCHMAKER (SIGNALING SERVER)
 * ==============================================================================
 * Mimar: SANTIS Karargâh Yüksek Komutası
 * İşlev: Tarayıcılar arası P2P tünelleri kurmak için sadece Adres (SDP/ICE) dağıtır.
 * Doktrin: "Asla veriye dokunma. Sadece tanıştır ve aradan çekil."
 * ==============================================================================
 */
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 }, () => {
    console.log("🕸️ [SANTIS NEXUS] Kör Çöpçatan (Signaling) 8080 portunda uyandı.");
});

const hiveNodes = new Map();

wss.on('connection', (ws) => {
    const nodeId = "SNT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    hiveNodes.set(nodeId, ws);

    console.log(`📡 [NEXUS] Yeni Ajan Kovana Katıldı: ${nodeId} (Aktif: ${hiveNodes.size})`);

    ws.on('message', (message) => {
        try {
            const payload = JSON.parse(message);
            
            // Yeni biri geldiyse, sadece içerideki ajanlara "Teklif Gönder" (Offer) emri ver (Glare / Çarpışma önleyici)
            if (payload.type === 'HIVE_DISCOVERY') {
                hiveNodes.forEach((client, id) => {
                    if (id !== nodeId && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'PEER_JOINED', peerId: nodeId }));
                    }
                });
                return;
            }

            // SDP/ICE fısıltıları doğrudan hedefe fırlatılır. Sunucu asla okumaz!
            if (payload.targetId && hiveNodes.has(payload.targetId)) {
                payload.senderId = nodeId; 
                hiveNodes.get(payload.targetId).send(JSON.stringify(payload));
            }
        } catch (e) { /* Zero-Exception Kalkanı */ }
    });

    ws.on('close', () => {
        hiveNodes.delete(nodeId);
        console.log(`🌑 [NEXUS] Ajan Koptu: ${nodeId} (Kalan: ${hiveNodes.size})`);
    });
});
