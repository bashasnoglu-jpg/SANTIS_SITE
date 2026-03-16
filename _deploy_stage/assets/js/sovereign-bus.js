/**
 * ═══════════════════════════════════════════════════════════
 * 🦅 SANTIS SOVEREIGN BUS v3.0 — RESILIENT UNIFIED WEBSOCKET
 * ═══════════════════════════════════════════════════════════
 * Tek WebSocket, tüm motorlara hizmet eder.
 *
 * v3.0 Yenilikler:
 *   • Mesaj Kuyruğu — kopukken gönderilen mesajlar sıraya alınır
 *   • Heartbeat Ping/Pong — 25s'de bir canlılık kontrolü
 *   • Bağlantı Durumu Olayları — 'bus:connected' / 'bus:disconnected'
 *   • Deduplication Guard — aynı mesaj 200ms içinde tekrar dağıtılmaz
 *   • Max Reconnect Cap — 10 denemeden sonra durur, manuel tetikleme bekler
 *
 * Kullanım:
 *   SovereignBus.subscribe('SOVEREIGN_AURA', (data) => { ... });
 *   SovereignBus.send({ type: 'beacon', page: '/tr/' });
 *   SovereignBus.on('bus:connected', () => { ... });
 */

(function () {
    'use strict';

    if (window.SovereignBus) return;

    const MAX_QUEUE = 50;
    const MAX_ATTEMPTS = 10;
    const HEARTBEAT_INTERVAL = 25000; // 25s
    const DEDUP_WINDOW = 200;         // 200ms

    const Bus = {
        _ws: null,
        _listeners: {},
        _queue: [],                   // Kopukken biriken mesajlar
        _reconnectAttempts: 0,
        _maxDelay: 30000,
        _baseDelay: 5000,             // v3.1: 3s → 5s minimum bekleme
        _isConnected: false,
        _heartbeatTimer: null,
        _lastMessageHash: null,
        _lastMessageTime: 0,
        _stopped: false,
        _lastConnectTime: 0,          // v3.1: Rapid disconnect detection
        _rapidDisconnectThreshold: 5000, // v3.1: 5s içinde kapanırsa "rapid"

        // ── PUBLIC API ────────────────────────────────────

        /** Olaya abone ol */
        subscribe(eventType, callback) {
            if (!this._listeners[eventType]) this._listeners[eventType] = [];
            this._listeners[eventType].push(callback);
        },

        /** Bağlantı durumu olaylarına abone ol */
        on(event, callback) {
            this.subscribe(event, callback);
        },

        /** Sunucuya mesaj gönder (kopukken kuyruğa alır) */
        send(data) {
            if (this._ws && this._ws.readyState === WebSocket.OPEN) {
                this._ws.send(JSON.stringify(data));
            } else if (this._queue.length < MAX_QUEUE) {
                this._queue.push(data);
            }
        },

        /** Bağlantı durumu */
        get connected() { return this._isConnected; },

        /** Durmuşsa manuel yeniden başlat */
        restart() {
            this._stopped = false;
            this._reconnectAttempts = 0;
            this._connect();
        },

        // ── INTERNAL ──────────────────────────────────────

        _connect() {
            if (this._stopped) return;
            if (window.SANTIS_API_ONLINE === false) return;

            const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            const url = `${protocol}${window.location.host}/ws?client_type=unified`;

            try {
                this._ws = new WebSocket(url);
            } catch (e) {
                this._scheduleReconnect();
                return;
            }

            this._ws.onopen = () => {
                this._isConnected = true;
                this._lastConnectTime = Date.now(); // v3.1: Bağlantı zamanını kaydet
                // NOT: reconnectAttempts burada SIFIRLANMAZ!
                // Sadece uzun süreli başarılı bağlantılardan sonra sıfırlanır (onclose'da kontrol edilir)
                console.log("🟢 [Sovereign Bus] Birleşik Otoban Aktif.");

                // Kuyruktaki mesajları sırayla gönder
                this._flushQueue();

                // Heartbeat başlat
                this._startHeartbeat();

                // Dinleyicileri bilgilendir
                this._dispatch({ type: 'bus:connected' });
            };

            this._ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Heartbeat pong cevabı — sessizce geç
                    if (data.type === 'pong' || data.type === 'welcome') return;

                    // Deduplication: Aynı mesaj 200ms içinde tekrarlanmasın
                    const hash = data.type + (data.action || '') + (data.service_id || '');
                    const now = performance.now();
                    if (hash === this._lastMessageHash && (now - this._lastMessageTime) < DEDUP_WINDOW) return;
                    this._lastMessageHash = hash;
                    this._lastMessageTime = now;

                    this._dispatch(data);
                } catch (e) { /* Bozuk JSON */ }
            };

            this._ws.onclose = () => {
                const connectionDuration = Date.now() - this._lastConnectTime;
                this._isConnected = false;
                this._stopHeartbeat();
                this._dispatch({ type: 'bus:disconnected' });

                // v3.1: Rapid disconnect detection
                // Bağlantı 5s'den uzun sürdüyse → sağlıklıydı, attempts sıfırla
                // 5s'den kısa sürdüyse → sunucu reddediyor, backoff artmaya devam etsin
                if (connectionDuration > this._rapidDisconnectThreshold) {
                    this._reconnectAttempts = 0; // Sağlıklı bağlantıydı, sıfırla
                    console.log('🔄 [Sovereign Bus] Sağlıklı bağlantı koptu, hızlı yeniden bağlanılıyor...');
                } else {
                    console.warn(`⚠️ [Sovereign Bus] Hızlı kopma tespit edildi (${connectionDuration}ms). Backoff artıyor... (deneme ${this._reconnectAttempts + 1}/${MAX_ATTEMPTS})`);
                }

                this._scheduleReconnect();
            };

            this._ws.onerror = () => {};
        },

        /** Tip bazlı mesaj dağıtımı */
        _dispatch(data) {
            const type = data.type || data.action || data.event || '_raw';

            // Tip bazlı dinleyiciler
            if (this._listeners[type]) {
                this._listeners[type].forEach(fn => { try { fn(data); } catch(e) {} });
            }

            // Wildcard dinleyiciler
            if (this._listeners['*']) {
                this._listeners['*'].forEach(fn => { try { fn(data); } catch(e) {} });
            }
        },

        /** Kuyruktaki mesajları gönder */
        _flushQueue() {
            while (this._queue.length > 0) {
                const msg = this._queue.shift();
                this._ws.send(JSON.stringify(msg));
            }
        },

        /** Heartbeat — sunucuyla canlılık kontrolü */
        _startHeartbeat() {
            this._stopHeartbeat();
            this._heartbeatTimer = setInterval(() => {
                if (this._ws && this._ws.readyState === WebSocket.OPEN) {
                    this._ws.send(JSON.stringify({ type: 'ping', t: Date.now() }));
                }
            }, HEARTBEAT_INTERVAL);
        },

        _stopHeartbeat() {
            if (this._heartbeatTimer) {
                clearInterval(this._heartbeatTimer);
                this._heartbeatTimer = null;
            }
        },

        /** Exponential Backoff + Max Attempt Cap */
        _scheduleReconnect() {
            if (this._reconnectAttempts >= MAX_ATTEMPTS) {
                console.warn(`🛑 [Sovereign Bus] ${MAX_ATTEMPTS} deneme aşıldı. Manuel yeniden başlatma gerekiyor: SovereignBus.restart()`);
                this._stopped = true;
                return;
            }
            const delay = Math.min(this._baseDelay * (2 ** this._reconnectAttempts), this._maxDelay);
            this._reconnectAttempts++;
            setTimeout(() => this._connect(), delay);
        },

        // ── BOOT ──────────────────────────────────────────
        init() { this._connect(); }
    };

    window.SovereignBus = Bus;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Bus.init());
    } else {
        Bus.init();
    }
})();
