/**
 * 🚀 SANTIS STREAM PROTOCOL (Nihai Kurumsal Çekirdek)
 * Binary-First, Backpressure-Safe, Self-Healing Distributed Node
 */

const GLOBAL_KEY = "__SANTIS_STREAM_PROTOCOL__";
const SAFE_CHANNEL = /^[a-zA-Z0-9_\-]+$/; // 🛡️ 5. Anti-Injection Zırhı

class SantisStreamProtocol {
  constructor(url) {
    // 🔒 0. GLOBAL HARD LOCK: Asla iki kopya oluşmasına izin verme
    if (globalThis.__SOVEREIGN_WS_INSTANCE__) {
        console.warn("🛡️ [Sovereign v3] İkinci kopya oluşumu engellendi. Mevcut referans dönülüyor.");
        return globalThis.__SOVEREIGN_WS_INSTANCE__;
    }

    // 🛡️ [Layer A] Sovereign WS Lock Check
    if (typeof window.__SANTIS_WS_LOCK_GUARD__ === 'function' && !window.__SANTIS_WS_LOCK_GUARD__("Santis_Core_WS")) {
        return globalThis.__SOVEREIGN_WS_INSTANCE__;
    }
    
    globalThis.__SOVEREIGN_WS_INSTANCE__ = this;
    
    this.url = url;
    this.socket = null;
    this.isConnected = false;
    this.isLeader = false;
    this.bootTime = Date.now();

    this.identity = null;
    this.explicitPageExit = false;
    this.isIntentionalClose = false;

    // 📦 1. BACKPRESSURE & QUEUE LİMİTLERİ
    this.MAX_QUEUE = 100;
    this.messageQueue = [];
    this.BUFFER_LIMIT = 256 * 1024; // 🚨 256KB WS Buffer Sınırı (Sunucu Boğulma Koruması)

    // 💓 WS HEARTBEAT
    this.lastPingId = 0;
    this.pingInterval = null;
    this.pongTimeout = null;

    // 💀 3. LEADER FREEZE (DEAD-MAN SWITCH / MUTINY ENGINE)
    this.leaderHeartbeatTimer = null;
    this.mutinyWatchTimer = null;
    this.LEADER_PING_KEY = "santis_leader_beat";

    // 📡 KANALLAR VE STATE CACHE (Delta Updates İçin)
    this.channels = new Map();
    this.channelStates = new Map();

    // 🌊 2. BROADCAST BATCHING ENGINE (GC Koruması)
    this.bus = new BroadcastChannel('santis_stream_bus');
    this.broadcastQueue = [];
    this.broadcastScheduled = false;

    // 🔄 SMART RECONNECT
    this.reconnectAttempts = 0;
    this.baseDelay = 1000;
    this.offline = false; // SANTIS RESILIENCE LAYER

    // 🔋 SOVEREIGN POWER FLOW (Otonom Jitter Karar Motoru)
    this.jitterWindow = [];
    this.JITTER_WINDOW_SIZE = 5;
    this.currentPowerLevel = "OPTIMAL"; // OPTIMAL | ZEN | SURVIVAL
    this.lastPingSentAt = 0;

    this._initBusListeners();
    this._setupNetworkHooks();
    
    // 🧹 4. DEFENSIVE CLEANUP: Sekme kapanırken / Refresh atılırken zombi vadesini doldursun
    const cleanup = (e) => {
        if (this.explicitPageExit) return;
        this.explicitPageExit = true;
        console.log("🧹 [WS] Sekme kapanıyor, PAGE_EXIT sinyali atılıyor.");
        
        // PAGE_EXIT 
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const exitPayload = JSON.stringify({
                type: 'PAGE_EXIT',
                payload: {
                    reason: e.type, // 'beforeunload' veya 'pagehide'
                    pathname: location.pathname
                }
            });
            try { this.socket.send(exitPayload); } catch(err) {}
        }
        
        this.disconnect();
    };
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
    // HMR (Vite vs.) desteği iptal edildi, klasik browser uyumluluğu için import.meta kaldırıldı.
    
    // İsyan (Mutiny) kipi kapalı olarak ilk seçimi başlat
    this._electLeader();
  }

  // ==========================================
  // 👑 LİDER SEÇİMİ VE İSYAN (MUTINY) PROTOKOLÜ
  // ==========================================
  _electLeader({ steal = false } = {}) {
    if (!navigator.locks) {
      this._assumeLeadership();
      return;
    }

    // 🏴☠️ Eğer lider uyuduysa "steal: true" ile kilidi zorla gasp et!
    navigator.locks.request("santis_ws_leader", { mode: "exclusive", steal }, () => {
      return new Promise((resolve) => {
        this._assumeLeadership(steal);

        window.addEventListener("beforeunload", () => {
          this.isLeader = false;
          resolve(); // Sekme kapanırken kilidi efendice devret
        });
      });
    }).catch(err => {
      if (err.name === 'AbortError') {
        console.log("🏴☠️ [MUTINY] Eski Amiral Gemisinin kilidi acımasızca kırıldı. Yönetim el değiştirdi.");
      } else {
        console.error("❌ [CONSENSUS] Beklenmeyen Kilit Hatası:", err);
      }
    });

    // Lider olamazsak "İsyan Nöbeti"ne (Mutiny Watch) başla
    setTimeout(() => {
      if (!this.isLeader) this._startMutinyWatch();
    }, 100);
  }

  _assumeLeadership(wasStolen) {
    if (typeof window.SantisLog === 'function') window.SantisLog(`👑 [SANTIS-STREAM] Amiral Gemisi devrede. (İsyanla Alındı: ${wasStolen ? 'Evet' : 'Hayır'})`, "info");
    this.isLeader = true;
    clearInterval(this.mutinyWatchTimer);
    
    // Lider her 2 saniyede bir "Hayattayım" sinyali yazar
    localStorage.setItem(this.LEADER_PING_KEY, Date.now().toString());
    this.leaderHeartbeatTimer = setInterval(() => {
      if (this.isLeader) localStorage.setItem(this.LEADER_PING_KEY, Date.now().toString());
    }, 2000);

    this.connect();
  }

  _startMutinyWatch() {
    clearInterval(this.mutinyWatchTimer);
    
    this.mutinyWatchTimer = setInterval(() => {
      if (this.isLeader) return;
      
      // 🛡️ ATEŞKES: Sekme doğalı henüz 5 saniye olmadıysa isyanı beklet (Dost ateşini önler)
      if (Date.now() - this.bootTime < 5000) return; 
      
      const lastBeatStr = localStorage.getItem(this.LEADER_PING_KEY);
      const lastBeat = lastBeatStr ? Number(lastBeatStr) : Date.now();
      
      if (Date.now() - lastBeat > 5000) {
        console.warn("💀 [MUTINY] Hayalet Lider tespit edildi! İsyan başlatılıyor...");
        clearInterval(this.mutinyWatchTimer);
        this._electLeader({ steal: true }); 
      }
    }, 3000);
  }

  // ==========================================
  // 🌊 MİKRO-BATCHING (CPU & GC RAHATLATMA)
  // ==========================================
  _safeBroadcast(type, channel, payload) {
    this.broadcastQueue.push({ type, channel, payload });

    if (!this.broadcastScheduled) {
      this.broadcastScheduled = true;

      // 🚨 DİKKAT: requestAnimationFrame arka plan sekmelerde 0'a düşer (çalışmaz).
      // Background sekmelerin veriyi işleyebilmesi için setTimeout(..., 16) kullanıldı. (~60FPS)
      setTimeout(() => {
        this.bus.postMessage({ type: "BATCH", payload: this.broadcastQueue });
        this.broadcastQueue = [];
        this.broadcastScheduled = false;
      }, 16); 
    }
  }

  _initBusListeners() {
    this.bus.onmessage = (event) => {
      if (event.data.type === "BATCH") {
        event.data.payload.forEach(msg => {
          if (msg.type === "WS_INCOMING" && !this.isLeader) {
            this._triggerLocal(msg.channel, msg.payload);
          } 
          else if (msg.type === "WS_OUTGOING" && this.isLeader) {
            this._internalSend(msg.channel, msg.payload);
          }
        });
      }
    };
  }

  // ==========================================
  // 🔌 AĞ BAĞLANTISI KİNCİ REAKSİYONLARI
  // ==========================================
  _setupNetworkHooks() {
    window.addEventListener('online', () => {
      this.offline = false;
      this.currentPowerLevel = "OPTIMAL";
      if(this.isLeader) {
         console.log("🟢 [SANTIS-STREAM] Ağ geri geldi, otomatik yeniden bağlanıyor.");
         this.reconnectAttempts = 0;
         this.connect();
      }
    });

    window.addEventListener('offline', () => {
      this.offline = true;
      this.currentPowerLevel = "SURVIVAL";
      if(this.isLeader) {
         console.warn("🔻 [SANTIS-STREAM] Ağ kesildi, motorlar güvenli moda iniyor.");
         this.disconnect();
      }
    });
  }

  // ==========================================
  // 🌐 BİNARY AĞ MOTORU (Milisaniye Seviyesi)
  // ==========================================
  connect() {
    if (!this.isLeader) return;
    
    // 🧠 1. CONNECT GUARD (Hydration Race Condition Fix)
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    if (this.isConnecting) {
        return;
    }
    
    // Eğer kasıtlı olarak kapatıldıysa (disconnect çağrıldıysa) tekrar bağlanma
    if (this.isIntentionalClose) {
        return;
    }

    this.isConnecting = true;
    
    // 🛡️ ZERO-TRUST IDENTITY GATE ("Parse, don't validate")
    if (!window.SantisIdentity) {
        console.warn("🛡️ [Sovereign Guard] Identity module (SantisIdentity) not ready. WS connect aborted. Hard Fail.");
        this.isConnecting = false;
        return;
    }

    this.identity = window.SantisIdentity.getIdentityBundle();
    if (!this.identity || !this.identity.visitorId || !this.identity.sessionId || !this.identity.connectionId) {
        console.error("💀 [Sovereign Guard] Identity module returned invalid tuple. WS connect aborted. Hard Fail.");
        this.isConnecting = false;
        return;
    }

    this.socket = new WebSocket(this.url);
    this.socket.binaryType = "arraybuffer"; // ⚡ 4. BİNARY HAZIRLIĞI

    this.socket.onopen = () => {
      this.isConnecting = false;
      
      // 🤝 SOVEREIGN v3 + PATCH PACK: INIT HANDSHAKE (Kimlik Bildirimi - Düztin (String) formatında)
      const role = (window.location.pathname.includes('/admin/') || window.location.pathname.includes('/hq')) ? 'admin' : 'frontend';
      const initPayload = JSON.stringify({
          type: 'INIT',
          namespace: role,
          token: this.token || 'ANONYMOUS',
          visitorId: this.identity?.visitorId,
          sessionId: this.identity?.sessionId,
          connectionId: this.identity?.connectionId,
          timestamp: Date.now()
      });
      // Metin katarı gönderiyoruz, arka uç (Backend) wsDecodeFrame hatasını önlüyor
      this.socket.send(initPayload);
      
      this.isHandshakeComplete = false; // Yeni tasdik mekanizması
      if (typeof window.SantisLog === 'function') window.SantisLog("🟢 [SANTIS-STREAM] Fiziksel Bağlantı Kuruldu. El Sıkışma Onayı (ACK) Bekleniyor...", "info");
      this.reconnectAttempts = 0;
      
      if (this.offline) {
          this.offline = false;
          console.log("🟢 [SANTIS-STREAM] Ağ geri geldi! Reaktif yetenekler (Canlı Senkronizasyon) devrede.");
          if (window.SantisAI) window.SantisAI.confidence = 0.99; // AI Güveni tam
          if (typeof SantisEventBus !== 'undefined') SantisEventBus.emit("network:restored");
      }

      this._startWsHeartbeat();
      // Not: flushQueue ve triggerLocal('open') artık ACK alındığında çağrılıyor
    };

    this.socket.onmessage = this._onMessage.bind(this);
    this.socket.onclose = this._onClose.bind(this);
    this.socket.onerror = (error) => {
        if (this.reconnectAttempts <= 3) {
            if (typeof window.SantisLog === 'function') window.SantisLog(`❌ [SANTIS-STREAM] Ağ anormalliği tespit edildi. (Bağlantı Denemesi: ${this.reconnectAttempts})`, "error");
        } else if (this.reconnectAttempts === 4) {
            if (typeof window.SantisLog === 'function') window.SantisLog("🔇 [SANTIS-STREAM] Sunucu iletişim ağı tamamen kapatıldı. Arka planda otonom moda iniliyor...", "warn");
        }
        this._triggerLocal('error', error);
        
        // 🛡️ Hata anında soketi asılı bırakma, çöpe at ki onclose tetiklensin.
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            this.socket.close();
        }
    };
  }

  _onMessage(event) {
    try {
      let parsedData;

      // ⚡ 4. JSON PARSE COST OPTİMİZASYONU (Binary First)
      let decoded = "";
      if (event.data instanceof ArrayBuffer) {
        decoded = new TextDecoder("utf-8").decode(event.data);
      } else if (typeof event.data === "string") {
        decoded = event.data;
      } else {
        return;
      }

      if (decoded === 'ping' || decoded === 'HEARTBEAT') {
        this.socket.send(new TextEncoder().encode('pong'));
        return;
      }

      if (decoded === 'pong' || decoded === 'HEARTBEAT_ACK') {
        clearTimeout(this.pongTimeout);
        if (this.lastPingSentAt > 0) {
            const latency = performance.now() - this.lastPingSentAt;
            this.lastPingSentAt = 0;
            this._evaluatePowerFlow(latency);
        }
        return;
      }

      parsedData = JSON.parse(decoded);

      if (parsedData.type === 'pong' || parsedData.type === 'HEARTBEAT_ACK') {
        clearTimeout(this.pongTimeout);
        if (this.lastPingSentAt > 0) {
            const latency = performance.now() - this.lastPingSentAt;
            this.lastPingSentAt = 0;
            this._evaluatePowerFlow(latency);
        }
        return;
      }

      // 🛡️ HANDSHAKE ACK KONTROLÜ
      if (!this.isHandshakeComplete && parsedData.type === 'ACK') {
        this.isHandshakeComplete = true;
        this.isConnected = true; // Gerçek bağlantı onayı buradadır
        if (typeof window.SantisLog === 'function') window.SantisLog("✅ [SANTIS-STREAM] ACK Görev Tamam! İkili Hatta Geçildi.", "success");
        // Flush queue ve event dağıtımı
        this._flushQueue();
        this._triggerLocal('open', null);
        return;
      }

      if (!this.isHandshakeComplete) {
        console.warn("⚠️ [WS Guard] Handshake henüz onaylanmadı (ACK bekleniyor), mesaj reddedildi.");
        return;
      }

      const channel = parsedData.channel || parsedData.type || "default";
      
      // 🛡️ 5. GÜVENLİK (Kanal Enjeksiyonu ve Proto-Pollution Koruması)
      if (!SAFE_CHANNEL.test(channel) || channel === "__proto__" || channel === "constructor") {
        console.warn(`⚠️ [SECURITY] Yasadışı/Tehlikeli kanal reddedildi: ${channel}`);
        return;
      }

      // 🧠 DELTA YAMALAMA MOTORU (Opsiyonel Diff Birleştirme)
      let finalPayload = parsedData.payload !== undefined ? parsedData.payload : parsedData;
      if (parsedData.isDelta && typeof finalPayload === 'object') {
          const currentState = this.channelStates.get(channel) || {};
          finalPayload = { ...currentState, ...finalPayload }; // Değişenleri üstüne yaz
      }
      
      // State'i cache'le ki yeni component render olduğunda anında veriyi alabilsin
      this.channelStates.set(channel, finalPayload);

      this._triggerLocal(channel, finalPayload);
      // Geriye dönük 'message' catch-all uyumluluğu
      this._triggerLocal('message', parsedData);

      this._safeBroadcast("WS_INCOMING", channel, finalPayload);
      this._safeBroadcast("WS_INCOMING", 'message', parsedData);

    } catch (err) {
      console.warn("⚠️ [SANTIS-STREAM] Corrupted Frame (Veri Bozuk):", err);
    }
  }

  // ==========================================
  // 🚨 BACKPRESSURE DESTEKLİ GÖNDERİM KONTROLÜ
  // ==========================================
  
  // ⚠️ DEFENSIVE CLEANUP (Memory Leak Tuzağı Yok Edildi)
  addListener(event, callback) {
    return this.subscribe(event, callback);
  }

  removeListener(event, callback) {
    if (this.channels.has(event)) {
      this.channels.get(event).delete(callback);
    }
  }

  subscribe(channel, callback) {
    if (!this.channels.has(channel)) this.channels.set(channel, new Set());
    this.channels.get(channel).add(callback);

    // LATE SUBSCRIBER: Component sonradan mount olduysa, cache'deki son veriyi anında ver (Zero-Latency)
    if (this.channelStates.has(channel)) {
        try { callback(this.channelStates.get(channel)); } catch (e) {}
    }

    return () => {
      this.channels.get(channel).delete(callback);
      if (this.channels.get(channel).size === 0) {
          this.channels.delete(channel);
          // İsteğe bağlı: this.channelStates.delete(channel); 
      }
    };
  }

  _triggerLocal(channel, payload) {
    if (this.channels.has(channel)) {
      this.channels.get(channel).forEach(cb => {
          try { cb(payload); } catch (e) { console.error(`[WS] ${channel} callback error:`, e); }
      });
    }
  }

  send(payload) {
    let channel = 'default';
        
    let parsedPayload = payload;
    if (typeof payload === 'string') {
        try { 
            const obj = JSON.parse(payload); 
            if (obj.channel || obj.type) channel = obj.channel || obj.type; 
            parsedPayload = obj;
        } catch(e) {}
    } else if (payload && (payload.channel || payload.type)) {
        channel = payload.channel || payload.type;
    }

    if (!SAFE_CHANNEL.test(channel)) {
        console.warn("⚠️ [SECURITY] Yasadışı sınır dışı kanal (Send):", channel);
        return false;
    }

    if (!this.isLeader) {
      this._safeBroadcast("WS_OUTGOING", channel, parsedPayload);
      return true;
    }
    
    this._internalSend(channel, parsedPayload);
    return true;
  }

  _internalSend(channel, payload, isSystem = false) {
    // ⚡ İleride burası: const message = MessagePack.encode({channel, payload}) olacak
    let messageStr;
    if (isSystem) {
        messageStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    } else {
        messageStr = JSON.stringify({ channel, payload });
    }

    if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      
      // 🚨 1. BACKPRESSURE KALKANI: Sunucu boğulmasını engelle
      if (this.socket.bufferedAmount > this.BUFFER_LIMIT) {
        console.warn(`⚠️ WS Buffer Dolu (${this.socket.bufferedAmount} bytes). Paket DROP edildi: [${channel}]`);
        return; // Veriyi feda et, server'ı kurtar!
      }

      // String yerine Binary atıyoruz ki Backend native buffer olarak okuyabilsin
      const binaryFrame = new TextEncoder().encode(messageStr);
      this.socket.send(binaryFrame);
      
    } else {
      if (!isSystem) {
        if (this.messageQueue.length >= this.MAX_QUEUE) this.messageQueue.shift();
        this.messageQueue.push(messageStr); // Bekleyenleri sıraya al
      }
    }
  }

  _flushQueue() {
    while (this.messageQueue.length > 0 && this.socket.readyState === WebSocket.OPEN) {
      if (this.socket.bufferedAmount > this.BUFFER_LIMIT) break; // Buffer şiştiyse fırlatmayı kes
      const msg = this.messageQueue.shift();
      const binaryFrame = new TextEncoder().encode(msg);
      this.socket.send(binaryFrame);
    }
  }

  _startWsHeartbeat() {
      if (this.pingInterval) clearInterval(this.pingInterval);
      if (this.pongTimeout) clearTimeout(this.pongTimeout);

      this.pingInterval = setInterval(() => {
          if (!this.isConnected || this.socket.readyState !== WebSocket.OPEN) return;
          const pingId = ++this.lastPingId;
          
          this.lastPingSentAt = performance.now(); // TRACE PING FOR POWER FLOW
          const binaryFrame = new TextEncoder().encode('ping');
          this.socket.send(binaryFrame);

          this.pongTimeout = setTimeout(() => {
              // Eğer zaman aşımına uğradıysa pong gelmemiştir. (lastPingId artmadı)
              if (this.lastPingId === pingId && this.socket) this.socket.close();
          }, 5000);
      }, 10000);
  }

  _onClose() {
      this.isConnected = false;
      this.isHandshakeComplete = false;
      clearTimeout(this.pongTimeout);
      clearInterval(this.pingInterval);
      this._triggerLocal('close', null);
      
      if (this.isLeader) {
          if (this.isIntentionalClose) return; // Kasıtlı kapanışlarda reconnect etme
          this.reconnectAttempts++;
          
          // OFFLINE INTELLIGENCE MODE (SANTIS RESILIENCE LAYER)
          if (this.reconnectAttempts >= 3 && !this.offline) {
              this.offline = true;
              if (typeof window.SantisLog === 'function') window.SantisLog("🌑 [SANTIS-STREAM] Ağ koptu. Offline Intelligence (Otonom) moduna geçiliyor.", "warn");
              if (window.SantisAI) window.SantisAI.confidence = 0.6; // AI fazla emin konuşmasın
              if (typeof SantisEventBus !== 'undefined') SantisEventBus.emit("network:offline_intelligence");
          }
          
          if (this.reconnectAttempts > 8) {
              // Sonsuz döngü kırıcı (Infinite Loop Breaker)
              return; 
          }

          // Recovery Strategy: Offline'a düştüysek yavaş ve sessiz dene
          if (this.offline) {
              if (this.reconnectAttempts <= 5 && typeof window.SantisLog === 'function') {
                  window.SantisLog("⏳ [SANTIS-STREAM] 10 saniye içinde sessiz ping atılacak...", "info");
              }
              const jitter = Math.floor(Math.random() * 750);
              setTimeout(() => this.connect(), 10000 + jitter);
              return;
          }
          
          // 🛡️ 2. SAVUNMA HATTI: EXPONENTIAL BACKOFF + JITTER
          // VS Code ve Chrome'un sunucuya aynı anda DDoS atmasını kökünden çözer!
          const MAX_BACKOFF_MS = 15000;
          const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), MAX_BACKOFF_MS);
          
          // JITTER: 0-750ms arası rastgele KAOS PAYI.
          // Biri 1100ms sonra, diğeri 1650ms sonra uyanacağı için çarpışma (Race Condition) imkansızlaşır.
          const jitter = Math.floor(Math.random() * 750); 
          const delay = baseDelay + jitter;
          
          console.warn(`⏳ [Backoff] Ağ sarsıntısı sönümleniyor... ${delay}ms bekleniyor (Deneme: ${this.reconnectAttempts})`);
          setTimeout(() => this.connect(), delay);
      }
  }


  // ==========================================
  // 🔋 SOVEREIGN POWER FLOW (AI JITTER KARAR MOTORU)
  // ==========================================
  _evaluatePowerFlow(latency) {
      this.jitterWindow.push(latency);
      if (this.jitterWindow.length > this.JITTER_WINDOW_SIZE) {
          this.jitterWindow.shift();
      }

      // Pencere dolduğunda veya kopma varsa karar ver
      if (this.jitterWindow.length < this.JITTER_WINDOW_SIZE && this.reconnectAttempts < 5) return;

      const avgJitter = this.jitterWindow.length > 0 ? this.jitterWindow.reduce((a, b) => a + b, 0) / this.jitterWindow.length : 0;
      
      let nextLevel = "OPTIMAL";
      if (avgJitter > 150) nextLevel = "ZEN";
      else if (avgJitter > 80) nextLevel = "TRIAGE";

      if (this.reconnectAttempts >= 5) {
          nextLevel = "SURVIVAL"; // Zombi patlaması veya derin kopma
      }

      if (this.currentPowerLevel !== nextLevel) {
          this._applyPowerFlowLevel(nextLevel, avgJitter);
      }
  }

  _applyPowerFlowLevel(level, avgJitter) {
      if (typeof window.SantisLog === 'function') {
          window.SantisLog(`🔋 [Power Flow] Sistem Triage: ${this.currentPowerLevel} -> ${level} (Ort. Jitter: ${Math.round(avgJitter)}ms)`, "warn");
      }
      this.currentPowerLevel = level;
      const root = document.documentElement;

      switch(level) {
          case "OPTIMAL":
              root.classList.remove('power-flow-triage', 'power-flow-zen', 'power-flow-survival');
              document.body.style.pointerEvents = "auto";
              break;
          case "TRIAGE":
              root.classList.add('power-flow-triage');
              root.classList.remove('power-flow-zen', 'power-flow-survival');
              break;
          case "ZEN":
              root.classList.add('power-flow-zen');
              root.classList.remove('power-flow-triage', 'power-flow-survival');
              break;
          case "SURVIVAL":
              root.classList.add('power-flow-survival');
              document.body.style.pointerEvents = "none";
              console.error("💀 [Sovereign Power Flow] Kritik sarsıntı! Arayüz reaktivitesi donduruldu (Survival Mode).");
              break;
      }
      
      // Diğer MFE'lere ve Optic Nerve'e duyur
      this._triggerLocal('POWER_FLOW_CHANGE', { level, jitter: avgJitter });
  }

  disconnect() {
    this.isIntentionalClose = true;
    clearTimeout(this.pongTimeout);
    clearInterval(this.pingInterval);
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.onclose = null; // Reconnect döngüsünü engelle
        this.socket.close(1000, "teardown"); // 1000 kodu ile kasıtlı ve nizami kapatış
      }
      this.socket = null;
    }
    this.bus.close();
    console.log("🛑 [SANTIS-STREAM] Motorlar manuel olarak durduruldu.");
  }
}

// Auto-discover the correct WS endpoint based on current protocol
const getDefaultUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // 🛡️ V3: URL Payload izole edildi. Artık Anonymous başlar, Handshake ile kimliklenir.
    return `${protocol}//${window.location.hostname}:3030/ws`; 
};

// 🌐 HARDENED EXPORT (Sovereign V3) + Singleton Guard
if (window.__SANTIS_WS_BOOTED__) {
  console.warn('WS already booted (Singleton Guard triggered)');
} else {
  window.__SANTIS_WS_BOOTED__ = true;
  
  if (!globalThis.__SOVEREIGN_WS_INSTANCE__) {
    globalThis.__SOVEREIGN_WS_INSTANCE__ = new SantisStreamProtocol(getDefaultUrl());
  }

  window.SovereignWS = globalThis.__SOVEREIGN_WS_INSTANCE__;
  window.santisBus = globalThis.__SOVEREIGN_WS_INSTANCE__;
  window.santisStream = globalThis.__SOVEREIGN_WS_INSTANCE__;

  // ==========================================
  // ⚔️ SANTIS OS BRIDGE: BROWSER ↔ NODE KERNEL
  // ==========================================
  window.SovereignWS.executeOS = function(command) {
      console.log(`📡 [SANTIS KERNEL] OS Intent Gönderiliyor: "${command}"`);
      this.send({ channel: 'OS_COMMAND', payload: command });
  };

  // OS Cevaplarını Otomatik Dinle (Global Log)
  window.SovereignWS.subscribe('OS_RESPONSE', (res) => {
      console.log(`\n%c================= OS RESPONSE =================\n${res}\n===============================================`, "color: #10b981; font-family: monospace;");
  });

  window.SovereignWS.subscribe('OS_ERROR', (err) => {
      console.error(`\n%c============ OS SECURITY / ERROR ============\n${err}\n=============================================`, "color: #ef4444; font-weight: bold; font-family: monospace;");
  });

  // Eski Kernel'i sarmala
  window.SantisKernel = window.SantisKernel || {};
  window.SantisKernel.executeOS = (cmd) => window.SovereignWS.executeOS(cmd);
}
