import http from 'http';
import { Server } from 'socket.io';

// --- Port 3030: Single Truth Layer & Intelligence Bridge ---
const truthLayer = http.createServer((req, res) => {
  // Gelişmiş CORS Ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- CORE STATE (Hydration Bridge) ---
  if (req.url === '/api/v1/core-state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'Sovereign_Active',
      ftrIndex: 1.0,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  // 1. Antigravity AI Proxy Rotası
  if (req.url === '/api/antigravity/proxy' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log(`🌌 [Proxy] AI Görevi: ${payload.prompt}`);

        res.writeHead(200);
        res.end(JSON.stringify({ 
          result: `[Antigravity Proxy]: "${payload.prompt}" görevi başarıyla simüle edildi.`,
          status: 'simulated_success'
        }));
      } catch (error) {
         res.writeHead(400);
         res.end(JSON.stringify({ error: 'Geçersiz JSON formatı' }));
      }
    });
    return;
  }

  // 2. Telemetry & Decision Rotası (Bootloader için kritik)
  if (req.url === '/api/v1/telemetry/decision') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
        decision: 'Sovereign_Continue', 
        status: 'accepted' 
    }));
    return;
  }

  // 2.0 SSE Events Stream (Boardroom Live Intent Monitor)
  if (req.url === '/api/v1/stream/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Mock SSE Stream connected' })}\n\n`);

    const intervalId = setInterval(() => {
        // Just a heartbeat to keep it alive
        res.write(`data: ${JSON.stringify({ type: 'HEARTBEAT', ts: new Date().toISOString() })}\n\n`);
    }, 15000);

    req.on('close', () => {
        clearInterval(intervalId);
    });
    return;
  }

  // 2.1 RVS Telemetry Ingestion API (RVS-8 Stub)
  if (req.url === '/api/v1/telemetry/rvs' && req.method === 'POST') {
    let body = '';
    let byteLength = 0;

    req.on('data', chunk => {
      byteLength += chunk.length;
      if (byteLength > 8192) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload size limit exceeded (Max 8KB)' }));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });

    req.on('end', () => {
      if (byteLength > 8192) return;

      try {
        const envelope = JSON.parse(body);

        if (!envelope || typeof envelope !== 'object') {
          throw new Error('Payload must be a valid JSON object');
        }

        const { type, timestamp, sessionToken, normalizedPath, details } = envelope;

        if (!envelope.type || !envelope.timestamp || !envelope.sessionToken || !envelope.normalizedPath || !envelope.details) {
          throw new Error('Missing mandatory envelope fields (type, timestamp, sessionToken, normalizedPath, details)');
        }

        const ALLOWED_TYPES = new Set(['LAYOUT_REFLOW_ANOMALY', 'CINEMATIC_BUDGET_WARNING', 'SCENE_ENTROPY_SHIFT']);
        if (!ALLOWED_TYPES.has(type)) {
          throw new Error(`Invalid telemetry type: ${type}`);
        }

        if (typeof timestamp !== 'number' || timestamp <= 0) {
          throw new Error('Timestamp must be a valid positive number');
        }

        if (typeof sessionToken !== 'string' || !sessionToken.startsWith('anon_')) {
          throw new Error('sessionToken must be an anonymous token starting with "anon_"');
        }

        if (typeof normalizedPath !== 'string' || !normalizedPath.startsWith('/')) {
          throw new Error('normalizedPath must be a normalized route string starting with "/"');
        }

        if (!details || typeof details !== 'object' || Array.isArray(details)) {
          throw new Error('details must be a telemetry details object');
        }

        // PII Guard (Zero PII Compliance)
        const PII_KEYS_PATTERN = /email|password|pass|token|phone|card|address|ssn|user|name|surname|fullname|credentials|auth/i;
        const ALLOWED_TELEMETRY_KEYS = new Set([
          'type',
          'timestamp',
          'sessionToken',
          'normalizedPath',
          'details',
          'targetNode',
          'durationMs',
          'violatingProperty',
          'entropyScore',
          'activeComponents',
          'rafLoops',
          'particleCount',
          'heavyFilters'
        ]);

        const scanObject = (obj, seen = new WeakSet()) => {
          if (!obj || typeof obj !== 'object') return;
          if (seen.has(obj)) return;
          seen.add(obj);

          for (const key of Object.keys(obj)) {
            if (PII_KEYS_PATTERN.test(key) && key !== 'sessionToken') {
              throw new Error(`PII violation detected in payload key: "${key}"`);
            }
            if (!ALLOWED_TELEMETRY_KEYS.has(key)) {
              if (isNaN(key)) {
                throw new Error(`PII Guard: Forbidden key detected in telemetry envelope: "${key}"`);
              }
            }
            const val = obj[key];
            if (typeof val === 'string') {
              const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
              if (emailPattern.test(val)) {
                throw new Error('PII violation detected: email-like string found in values');
              }
            } else if (typeof val === 'object' && val !== null) {
              scanObject(val, seen);
            }
          }
        };

        scanObject(envelope);

        // Quiet Luxury premium console logging
        console.log(`\n\x1b[38;2;140;140;140m─── [SANTIS RVS INGESTION] ───────────────────────────\x1b[0m`);
        console.log(`\x1b[38;2;180;180;180mType:\x1b[0m      \x1b[38;2;220;220;220m${type}\x1b[0m`);
        console.log(`\x1b[38;2;180;180;180mRoute:\x1b[0m     \x1b[38;2;200;200;200m${normalizedPath}\x1b[0m`);
        const maskedSessionToken = sessionToken.length > 13 
          ? `${sessionToken.slice(0, 9)}…${sessionToken.slice(-4)}`
          : sessionToken;
        console.log(`\x1b[38;2;180;180;180mToken:\x1b[0m     \x1b[38;2;160;160;160m${maskedSessionToken}\x1b[0m`);
        if (details.durationMs) {
          console.log(`\x1b[38;2;180;180;180mDuration:\x1b[0m  \x1b[38;2;240;100;100m${details.durationMs}ms\x1b[0m`);
        }
        if (details.violatingProperty) {
          console.log(`\x1b[38;2;180;180;180mProperty:\x1b[0m  \x1b[38;2;220;180;100m${details.violatingProperty}\x1b[0m`);
        }
        console.log(`\x1b[38;2;140;140;140m────────────────────────────────────────────────────\x1b[0m`);

        res.writeHead(204);
        res.end();

      } catch (err) {
        console.error(`❌ [SANTIS RVS INGESTION ERROR] Validation failed: ${err.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 3. Socket.io Handshake (Vite üzerinden 8080 -> 3030 aktarımı için)
  if (req.url.startsWith('/socket.io/')) {
    res.writeHead(200);
    res.end('0{"sid":"sovereign-mock-session","upgrades":[],"pingInterval":25000,"pingTimeout":5000}');
    return;
  }

  // 4. Health Check Rotası
  if (req.url === '/api/health' || req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
        status: 'ok', 
        port: 3030, 
        layer: 'Sovereign Intelligence Bridge' 
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Rota bulunamadı: ' + req.url }));
  }
});

let currentHour = 9; // Sanal Günün Saati başlangıcı (09:00)

// --- AI'dan Otonom Fiyatlandırma Kararı Alan Fonksiyon ---
async function getAutonomousPricing(activeSessions, ftrScore, hour) {
    const context = {
        sessions: activeSessions,
        reality: ftrScore.toFixed(2),
        time: `${hour}:00`,
        period: hour < 12 ? 'Morning_Zen' : hour < 17 ? 'Afternoon_Flow' : 'Evening_Peak'
    };

    const prompt = `Santis AI Pricing Task: Context ${JSON.stringify(context)}. Generate multiplier and luxury reason.`;
    
    // Simüle edilmiş AI Karar Matrisi
    // Normalde fetch('http://localhost:3030/api/antigravity/proxy') ile gerçek AI'a gider.
    // Şimdilik deterministik bir zeka simüle ediyoruz.
    let multiplier = 1.0;
    let reason = "Standart Tarife";

    if (context.period === 'Evening_Peak' && activeSessions > 15) {
        multiplier = 1.25;
        reason = "Premium Akşam Seansı Yoğunluğu";
    } else if (context.period === 'Morning_Zen' && activeSessions < 10) {
        multiplier = 0.90;
        reason = "Erken Saat Zen İndirimi";
    } else if (ftrScore < 0.99) {
        multiplier = 1.15;
        reason = "Sovereign Kapasite Koruması";
    } else {
        multiplier = 1.05;
        reason = "Elit Saat Dilimi Deneyimi";
    }

    return { multiplier, reason };
}

truthLayer.listen(3030, async () => {
  console.log('✅ Truth Layer Bridge (Port 3030) aktif ve dinleniyor.');
  console.log('🚀 Port 8080 Admin Panel (Vite) için serbest bırakıldı.');
  console.log('🌐 Merkezi İstihbarat Köprüsü kuruldu.');

  const io = new Server(truthLayer, { cors: { origin: "*" } });

  io.on('connection', (socket) => {
    // --- Behavioral Prediction Engine ---
    socket.on('public:guest_intent', (intentData) => {
        console.log(`🧠 [Antigravity Prediction]: ${intentData.packageId} için niyet sinyali alındı.`);
        
        // Simüle edilmiş Öngörü Algoritması
        let conversionProbability = 0.40; 
        if (intentData.action === 'explanation_viewed') conversionProbability += 0.25;
        if (intentData.currentMultiplier > 1.0) conversionProbability += 0.15;

        const predictionEvent = {
            target: intentData.packageId,
            probability: (conversionProbability * 100).toFixed(1) + '%',
            insight: "Lüks fiyatlama mantığı incelendi. Dönüşüm ihtimali yüksek.",
            timestamp: new Date().toLocaleTimeString('tr-TR')
        };

        io.emit('admin:prediction_update', predictionEvent);

        // 🚀 Nudge Engine (Dürtü Motoru) Tetikleyicisi
        if (conversionProbability >= 0.75) {
            const nudgeOffer = {
                packageId: intentData.packageId,
                offerTitle: "Sovereign Ayrıcalığı",
                offerText: `Bu seansa özel, ${intentData.packageId} rezervasyonunuza +15 dakika 'Zen Focus' masajı hediye.`,
                expiresIn: 300 
            };
            // Sadece bu niyet sinyalini gönderen misafire özel teklif
            socket.emit('public:nudge_offer', nudgeOffer);
        }
    });

    // --- Aesthetic Intent Prediction ---
    socket.on('public:aesthetic_intent', (focusData) => {
        console.log(`👁️ [Antigravity Aesthetic]: Misafir "${focusData.assetId}" görseline ${focusData.dwellTimeSeconds}sn odaklandı. Strength: ${focusData.intentStrength}`);

        // Görsel odaklanma, niyetin en dürüst halidir.
        let conversionProbability = focusData.intentStrength === 'Deep_Focus' ? 0.82 : 0.55;

        const aestheticPrediction = {
            target: focusData.assetId,
            probability: (conversionProbability * 100).toFixed(1) + '%',
            insight: `Görsel odaklanma (Dwell Time: ${focusData.dwellTimeSeconds}s) derin niyet tespit etti. Misafir estetik bağ kurdu.`,
            timestamp: new Date().toLocaleTimeString('tr-TR')
        };

        io.emit('admin:prediction_update', aestheticPrediction);

        // Derin odaklanma varsa, AI saniyeler içinde teklifini sunar
        if (focusData.intentStrength === 'Deep_Focus') {
            socket.emit('public:nudge_offer', {
                packageId: focusData.assetId,
                offerTitle: "Estetik Seçim",
                offerText: `Bu görseldeki atmosfere olan ilginizi fark ettik. ${focusData.assetId} paketi için size özel bir rezervasyon önceliği tanıyalım.`,
                expiresIn: 600
            });
        }
    });

    // --- Environmental Intel Relay ---
    socket.on('public:atmosphere_sync', (data) => {
        console.log(`🌌 [Environmental Intel]: Atmosfer "${data.theme}" olarak ayarlandı. Sebep: ${data.reason}`);
        
        const radarEvent = {
            action: `Atmosfer: ${data.theme.toUpperCase()} (${data.reason})`,
            ftrIndex: 1.0,
            timestamp: new Date().toLocaleTimeString('tr-TR')
        };

        io.emit('admin:radar_update', radarEvent);
    });

    // --- Strategy Synthesis Engine (Sovereign Strategist AI) ---
    socket.on('admin:request_strategy_synthesis', () => {
        console.log('🧠 [Strategist AI]: Makro veri sentezi başlatıldı...');
        
        // Antigravity AI'ın analiz süresini simüle ediyoruz (Cinematic delay)
        setTimeout(() => {
            const aiReport = {
                reportId: `REP-${Date.now()}`,
                period: "Son 24 Saatlik Akış",
                executiveSummary: "Santis OS ekosistemi, 'Adriatic Night' atmosferine geçişle birlikte misafir etkileşimlerinde %18'lik bir 'Deep Focus' (Derin Odaklanma) artışı kaydetti. 'Zen Focus' dürtüleri (Nudge) misafirler tarafından yüksek oranda kabul görerek dönüşüm döngüsünü mühürledi.",
                keyInsights: [
                    "Paket görsellerindeki ortalama süzülme süresi 5.4 saniyeye ulaştı (Sovereign Standart: 3s).",
                    "Dinamik fiyatlandırma çarpanları, misafirlerin 'Mediterranean Zen' geçişlerine verdiği olumlu tepkiyle %94 oranında tolere edildi.",
                    "Sovereign Nudge motoru, 'Romantik Kaçış' paketinde anomali seviyesinde yüksek niyet yakaladı."
                ],
                recommendedAction: "Akşam saatlerindeki 'Adriatic Night' temasında, Sothys Premium paketlerine özel 1.15x 'Elite Hour' çarpanı uygulamak ve eş zamanlı olarak misafirlere 'Gece Ritüeli' dürtüsü sunmak karlılığı %12 artıracaktır.",
                confidenceScore: 94
            };

            socket.emit('admin:strategy_report_ready', aiReport);
            console.log('✅ [Strategist AI]: Stratejik makro sentez tamamlandı ve iletildi.');
        }, 2500); 
    });
  });

// --- Reality Globals ---
let basePriceMultiplier = 1.0;
const archiveMemory = []; // Egemen Hafıza (Sovereign Memory)

io.on('connection', (socket) => {
    console.log(`🔌 Sovereign Link established: ${socket.id}`);
    
    // Bağlantı anında mevcut arşivi gönder
    socket.emit('admin:archive_sync', archiveMemory);

    socket.on('admin:request_archive', () => {
        socket.emit('admin:archive_sync', archiveMemory);
    });

    socket.on('admin:execute_strategy', (data) => {
        console.log(`⚡ [Sovereign Command]: Stratejik eylem onaylandı (Report: ${data.reportId}). Ekosistem güncelleniyor...`);
        
        // AI Önerisini Gerçekliğe Dönüştür: Fiyat tabanını 1.15x'e çek
        basePriceMultiplier = 1.15;
        
        // Yeni gerçekliği tüm misafirlere fısılda
        const updateEvent = {
            packageId: "ALL_PREMIUM",
            newPrice: "Dynamic Update",
            multiplier: basePriceMultiplier.toFixed(2),
            reason: "Antigravity Stratejik Optimizasyon"
        };
        
        io.emit('public:pricing_update', updateEvent);

        // Radara stratejik zafer logu düş
        io.emit('admin:radar_update', {
            action: "STRATEJİK EYLEM: Fiyat Tabanı 1.15x Olarak Mühürlendi",
            ftrIndex: 1.15,
            timestamp: new Date().toLocaleTimeString('tr-TR')
        });

        // --- ARŞİVLEME (Sovereign Ledger) ---
        const newArchiveEntry = {
            id: `ARCHIVE-${Date.now()}`,
            type: 'STRATEGY_EXECUTION',
            description: `Antigravity AI Stratejik Sentezi Uygulandı (Rapor: ${data.reportId})`,
            impact: 'Fiyat Tabanı 1.15x & Atmosfer Optimizasyonu',
            timestamp: new Date().toISOString()
        };
        
        archiveMemory.unshift(newArchiveEntry);
        io.emit('admin:archive_sync', archiveMemory);

        console.log('✅ [Sovereign Command]: Ekosistem yeni stratejik parametrelere uyum sağladı.');
    });

    // --- Sovereign Simulator Engine ---
    socket.on('admin:run_simulation', () => {
        console.log('🔮 [Sovereign Simulator]: Gelecek 30 günün projeksiyonu hesaplanıyor...');
        
        setTimeout(() => {
            // Gerçeklik tabanlı simülasyon (Mevcut çarpan ve arşive dayalı)
            const growthFactor = basePriceMultiplier > 1.0 ? 1.12 : 1.05;
            const projectedRevenue = Math.floor(165000 * growthFactor);
            
            const simulationResult = {
                projectedRevenue,
                projectedFtr: (1.0 + (Math.random() * 0.1)).toFixed(2) * 1,
                insight: `Arşivdeki ${archiveMemory.length} stratejik eylem analiz edildi. Current Multiplier: ${basePriceMultiplier}x. 'Adriatic Night' atmosferinin akşam saatlerinde yarattığı 'Deep Focus' etkisi korunursa, önümüzdeki 30 gün içinde ciroda %${((growthFactor-1)*100).toFixed(0)} büyüme ve misafir memnuniyetinde (F_TR) stabilite öngörülmektedir.`,
                timestamp: new Date().toISOString()
            };
            
            socket.emit('admin:simulation_ready', simulationResult);
            console.log('✅ [Sovereign Simulator]: 30 günlük projeksiyon tamamlandı.');
        }, 2000);
    });
  });

  setInterval(async () => {
    // Sanal zamanı ilerlet (08:00 - 23:00 arası döngü)
    currentHour = currentHour >= 23 ? 8 : currentHour + 1;

    const randomAction = ["Giriş yapıldı", "Rezervasyon tamamlandı", "Ödeme onaylandı", "F_TR Kontrolü"];
    const action = randomAction[Math.floor(Math.random() * randomAction.length)];
    const currentFtrScore = 0.98 + (Math.random() * 0.04);

    // 1. Radar Update (Admin)
    io.emit('admin:radar_update', {
        timestamp: new Date().toLocaleTimeString(),
        action: action,
        ftrIndex: currentFtrScore,
        systemTime: `${currentHour}:00`
    });

    // 2. Financial Update (Admin)
    const mockFinance = {
        liveRevenue: 12500 + Math.floor(Math.random() * 5000),
        activeSessions: 8 + Math.floor(Math.random() * 15),
        pendingCommissions: 450 + Math.floor(Math.random() * 200)
    };
    io.emit('admin:finance_update', mockFinance);

    // 3. Otonom Pricing Update (AI Driven - Public)
    const pricingDecision = await getAutonomousPricing(mockFinance.activeSessions, currentFtrScore, currentHour);
    io.emit('public:pricing_update', pricingDecision);

  }, 5000);
});
