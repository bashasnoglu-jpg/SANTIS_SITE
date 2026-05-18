/**
 * 💀 SANTIS OS [TITAN CLASS] - LIVE NETWORK WORKER
 * Mimari: WebSocket Native Thread, Zero-Copy SAB, Auto-Reconnect, Fallback Simulator.
 */

let intView, floatView;
let writeIndex = 0; 
let isHibernating = false;
let tickCount = 1; 

// Ağ Yapılandırması
const WS_URL = 'ws://localhost:8082/live-pulse'; // PORT 8082 for the dedicated simulator
let ws = null;
let reconnectAttempts = 0;
let simInterval = null;
let isSimulating = true; // Sunucuya bağlanana kadar arayüz boş kalmasın diye simülasyonla başla

self.onmessage = (e) => {
    if (e.data.type === 'INIT_SAB') {
        intView = new Int32Array(e.data.buffer);
        floatView = new Float32Array(e.data.buffer);
        console.log("🌌 [Titan Worker] SAB Kilitlendi. Sovereign Ağ Köprüsü (WebSocket) Kuruluyor...");
        
        startSimulation(); // Bağlantı kurulana kadar sahte veri akıt
        connectLiveNetwork();

        // Main Thread bizi ölü sanmasın diye bağımsız kalp atışı (Lazarus Kalkanı)
        setInterval(pumpHeartbeat, 1000);
    } else if (e.data.type === 'HIBERNATE') {
        isHibernating = e.data.state;
    }
};

function connectLiveNetwork() {
    if (isHibernating) return;

    try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log("⚡ [Sovereign Umbilical] Canlı Sunucu Bağlantısı Başarılı!");
            reconnectAttempts = 0;
            if (isSimulating) stopSimulation(); // Gerçek veri akmaya başladı, simülasyonu sustur
        };

        ws.onmessage = (event) => {
            if (isHibernating || !intView) return;
            
            try {
                // 1. Ağır JSON Parse işlemi UI thread'i yerine izole çekirdekte yapılıyor!
                const payload = JSON.parse(event.data);
                
                // 2. Canlı veriyi çıkar
                const friction = payload.friction !== undefined ? payload.friction : 0;
                const activeUsers = payload.activeUsers !== undefined ? payload.activeUsers : 0;
                const throughput = payload.throughput !== undefined ? payload.throughput : 0.0;

                // 3. ZERO-COPY PAYLAŞIMLI BELLEĞE YAZ (Titan Zırhı)
                writeToSharedMemory(friction, activeUsers, throughput);

            } catch (err) {
                console.warn("⚠️ [Titan Worker] JSON Parse Hatası (Bozuk Paket):", err);
            }
        };

        ws.onclose = () => {
            console.warn("🔗 [Sovereign Umbilical] Bağlantı Koptu. Self-Healing devrede...");
            handleDisconnect();
        };

        ws.onerror = (err) => {
            ws.close(); // Hata varsa kapat, onclose otonom tetiklenecek
        };

    } catch (err) {
        handleDisconnect();
    }
}

// --- 🧠 SOVEREIGN AI MOTORU (Kognitif Hafıza) ---
const AI_MEMORY_SIZE = 5; // Son 5 saniyeyi hatırla (Kayan Pencere)
const frictionHistory = [];
const throughputHistory = [];

function analyzeIntent(friction, throughput) {
    frictionHistory.push(friction);
    throughputHistory.push(throughput);
    
    if (frictionHistory.length > AI_MEMORY_SIZE) {
        frictionHistory.shift();
        throughputHistory.shift();
    }
    
    // Yeterli veri yoksa ZEN dön (Sistem yeni uyanıyorsa)
    if (frictionHistory.length < AI_MEMORY_SIZE) return { stateCode: 0, confidence: 85.0 }; 
    
    // Türev Hesaplama (İvme / Değişim Hızı)
    const frictionDelta = frictionHistory[AI_MEMORY_SIZE - 1] - frictionHistory[0];
    const throughputDelta = throughputHistory[AI_MEMORY_SIZE - 1] - throughputHistory[0];
    
    let stateCode = 0; // 0: ZEN FLOW, 1: HESITATION, 2: RAGE RISK, 3: BUY INTENT
    let confidence = 85.0;
    
    if (frictionDelta > 15 && throughputDelta <= 0) {
        stateCode = 2; // DURUM 2: RAGE RISK (Stres artıyor, satış düşüyor/sabit)
        confidence = Math.max(12.5, 85.0 - frictionDelta * 1.5);
    } else if (frictionDelta < 5 && throughputDelta > 2) {
        stateCode = 3; // DURUM 3: BUY INTENT (Pürüzsüz akış, satış ivmeleniyor)
        confidence = Math.min(99.9, 85.0 + throughputDelta * 2.5);
    } else if (frictionDelta > 5) {
        stateCode = 1; // DURUM 1: HESITATION (Hafif stres birikimi)
        confidence = 65.0 - frictionDelta;
    }
    
    return { stateCode, confidence };
}

// ==========================================
// 💀 YENİ DOUBLE BUFFER YAZIMI (AI Genişletilmiş)
// ==========================================
function writeToSharedMemory(friction, activeUsers, throughput) {
    if (!intView) return;

    // 🧠 AI Tahminini Çalıştır (Geleceği Hesapla - Main Thread'den izole!)
    const aiResult = analyzeIntent(friction, throughput);

    // Yeni Buffer Haritası (Her Buffer 6 Hücre = 24 Byte)
    // Buffer 0: İndeks 0-5 | Buffer 1: İndeks 6-11 | ActiveIndex: 12 | DirtyFlag: 13
    const base = writeIndex * 6; 
    
    intView[base + 0] = friction;
    intView[base + 1] = activeUsers;
    floatView[base + 2] = throughput; 
    intView[base + 3] = tickCount++;  
    
    // 🔮 YENİ: YAPAY ZEKA KARARI PAYLAŞIMLI BELLEKTE!
    intView[base + 4] = aiResult.stateCode; // Niyet Kodu (0, 1, 2, 3)
    floatView[base + 5] = aiResult.confidence; // Kognitif Güven Skoru (%)

    // Atomic Flip & Dirty Flag (İndeksler 12 ve 13'e kaydı)
    Atomics.store(intView, 12, writeIndex); 
    Atomics.store(intView, 13, 1);          
    
    writeIndex = 1 - writeIndex; 
}

function handleDisconnect() {
    // UI "ölü" görünmesin diye sunucu koptuğunda anında simülasyona dön
    if (!isSimulating) {
        console.log("🔮 [Titan Worker] Sunucu ulaşılamaz durumda. Fallback Simülasyonu Aktif.");
        startSimulation();
    }

    // Exponential Backoff: Sunucuyu boğmamak için bekleme süresini katlayarak artır (1s, 2s, 4s...)
    reconnectAttempts++;
    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000); 
    
    console.log(`⏳ Tekrar bağlanılıyor... (${backoffTime}ms sonra - Deneme: ${reconnectAttempts})`);
    setTimeout(connectLiveNetwork, backoffTime);
}

function pumpHeartbeat() {
    if (!intView) return;
    const activeBase = (1 - writeIndex) * 6; // Kalp atışı çarpanı 6 oldu
    intView[activeBase + 3] = tickCount++;
}

// ==========================================
// 🛡️ FALLBACK SIMULATION (Güvenlik Ağı)
// ==========================================
function startSimulation() {
    isSimulating = true;
    if (simInterval) clearInterval(simInterval);
    
    simInterval = setInterval(() => {
        if (!isHibernating && isSimulating) {
            writeToSharedMemory(
                Math.floor(Math.random() * 30),        // Friction Sim
                Math.floor(Math.random() * 500 + 1000),// Canlı Kullanıcı Sim (1000-1500)
                Math.random() * 5 + 10                 // Satış Hızı Sim (MB/s)
            );
        }
    }, 800);
}

function stopSimulation() {
    isSimulating = false;
    if (simInterval) clearInterval(simInterval);
    console.log("🛑 [Titan Worker] Simülasyon durduruldu. Gerçek verilere kilitlenildi.");
}
