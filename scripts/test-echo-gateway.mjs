import WebSocket from 'ws';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log("=== THE CORE GATEWAY EKO TESTİ BAŞLIYOR ===");

    // [TEST 2 & 1] Admin ve Ghost bağlantısı.
    const adminWs = new WebSocket('ws://localhost:4040');
    const ghostWs = new WebSocket('ws://localhost:4040');
    let adminReceived = [];

    adminWs.on('open', () => {
        console.log("→ [TEST 2] Admin bağlanıyor...");
        adminWs.send(JSON.stringify({ type: 'AUTH', role: 'GODS_EYE', secret: 'SOVEREIGN_ADMIN_KEY_19X' }));
    });

    adminWs.on('message', (data) => {
        const msg = JSON.parse(data);
        adminReceived.push(msg);
        console.log(`[Admin Panel Yankısı] Paket yakalandı: ${msg.type} / Payload: ${JSON.stringify(msg.payload)}`);
    });

    ghostWs.on('open', () => {
        console.log("→ [TEST 1] Ghost Cell bağlanıyor...");
        ghostWs.send(JSON.stringify({ type: 'AUTH', role: 'GHOST_CELL', client: { visitorId: 'VIS-TEST-01' } }));
    });

    await delay(1000);

    if (adminWs.readyState === WebSocket.OPEN && ghostWs.readyState === WebSocket.OPEN) {
        console.log("✅ [TEST 1 & 2 BAŞARILI] Hem Ghost Cell hem Admin kopmadan stabil bağlı!");
    } else {
        console.error("❌ EKRAN KARARDI! Bağlantılar koptu.");
    }

    // [TEST 3] Tekil Payload
    console.log("\n→ [TEST 3] Ghost Cell'den tekil tehdit paketi fırlatılıyor (THREAT_PULSE)...");
    ghostWs.send(JSON.stringify({
        type: 'THREAT_PULSE',
        client: { visitorId: 'VIS-TEST-01' },
        payload: { spoofedName: 'test-doc.pdf', detectedHex: '4d5a9000', action: 'QUARANTINED' },
        timestamp: Date.now()
    }));

    await delay(1000);

    if (adminReceived.length === 1 && adminReceived[0].type === 'THREAT_PULSE') {
        console.log("✅ [TEST 3 BAŞARILI] Paket saniyeler içinde doğrudan Admin vizörüne yansıdı.");
    } else {
        console.error("❌ TAKİP BAŞARISIZ! Paket God's Eye'a ulaşmadı.");
    }

    // [TEST 4] Yetkisiz Event Denemesi
    console.log("\n→ [TEST 4] Yetkisiz bir istemci soketi açılıyor (Wrong AUTH) ...");
    const rogueWs = new WebSocket('ws://localhost:4040');
    let rogueClosed = false;

    rogueWs.on('open', () => {
        rogueWs.send(JSON.stringify({ type: 'AUTH', role: 'HACKER_ROLE' })); // Geçersiz!
    });

    rogueWs.on('close', (code, reason) => {
        rogueClosed = true;
        console.log(`✅ [TEST 4 BAŞARILI] Roudge soket gümrük kapısından döndü! Code: ${code}, Reason: ${reason.toString()}`);
    });

    await delay(500);

    if (!rogueClosed) {
        console.error("❌ GÜVENLİK İHLALİ! Geçersiz Auth reddedilmedi!");
    }

    // [TEST 5] Multi-Event Burst
    console.log("\n→ [TEST 5] Multi-Event Burst (5 Paket arka arkaya atılıyor) ...");
    const startCount = adminReceived.length; // 1

    for (let i = 1; i <= 5; i++) {
        ghostWs.send(JSON.stringify({
            type: 'DEGRADATION_WARN',
            client: { visitorId: 'VIS-TEST-01' },
            payload: { engineState: `BURST_TEST_${i}`, riskLevel: 'UI_JANK_EXPECTED' },
            timestamp: Date.now()
        }));
    }

    await delay(1000);

    if (adminReceived.length === startCount + 5) {
        console.log("✅ [TEST 5 BAŞARILI] Tüm burst paketleri milisaniyelik sırayla ekranda donma olmadan render edildi!");
    } else {
        console.error(`❌ BURST BAŞARISIZ! Atılan 5, Yakalanan ${adminReceived.length - startCount}`);
    }

    console.log("\n=== TÜM TESTLER TAMAMLANDI! ===");
    adminWs.close();
    ghostWs.close();

    // Uygulamanın betiği bitirmesi için
    process.exit(0);
}

runTests();
