/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SANTIS WS MANAGER v2.0  —  Sovereign WebSocket Singleton       ║
 * ║  acquire/release · channel diffing · visibility guard · debug   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * KULLANIM — App-level owner (tek yer):
 *   SantisWS.acquire({ role:'watcher', channels:['SYSTEM_HEALTH'] });
 *   ...cleanup...
 *   SantisWS.release();
 *
 * KULLANIM — Feature-level consumer:
 *   const off = SantisWS.on('THREAT_PULSE', handler);
 *   ...cleanup...
 *   off();
 *
 * YASAK:  new WebSocket() · socket.send(HELLO) · terminate() feature içinde
 * SERBEST: acquire() · on() · off() · release() · send()
 */

const WS_CFG = {
  url: (() => {
    const token = window.SANTIS_WS_TOKEN || localStorage.getItem("SANTIS_WS_TOKEN") || "santis-dev-token";
    return `ws://localhost:8080/ws?role=watcher&token=${encodeURIComponent(token)}`;
  })(),
  maxRetries:       8,
  baseBackoffMs:    1_000,
  maxBackoffMs:     30_000,
  heartbeatMs:      20_000,
  heartbeatLimit:   2,        // Bu kadar PONG kaçırılırsa kill
  visibilitySlack:  2,        // Hidden sekmede heartbeat limitini bu kadar genişlet
};

// ─── Singleton Gate ───────────────────────────────────────────────────────────
window.__SANTIS_WS__ = window.__SANTIS_WS__ || (() => {

  // ── İç Durum ────────────────────────────────────────────────────────────────
  let _socket         = null;
  let _retryTimer     = null;
  let _heartbeatTimer = null;
  let _retryCount     = 0;
  let _missedPongs    = 0;
  let _intentional    = false;
  let _subscribed     = false;
  let _connectOpts    = {};

  let _refCount        = 0;                 // acquire/release sayacı
  let _activeChannels  = new Set();         // sunucuya bildirilmiş kanallar
  let _pendingChannels = new Set();         // istenip henüz gönderilmemiş kanallar
  let _graceTimer      = null;              // release grace period timer (300ms)
  const GRACE_MS       = 300;              // mount/unmount flicker penceresi

  const _listeners    = new Map();         // type → Set<fn>

  // ── Debug Kayıt ─────────────────────────────────────────────────────────────
  const _dbg = {
    state:      'CLOSED',
    retries:    0,
    channels:   [],
    lastPingAt: null,
    lastPongAt: null,
    refCount:   0,
  };
  window.__SANTIS_WS_DEBUG__ = _dbg;
  function _syncDebug() {
    _dbg.state    = _readyLabel();
    _dbg.retries  = _retryCount;
    _dbg.channels = [..._activeChannels];
    _dbg.refCount = _refCount;
  }
  function _readyLabel() {
    if (!_socket) return 'CLOSED';
    return ['CONNECTING','OPEN','CLOSING','CLOSED'][_socket.readyState] ?? 'UNKNOWN';
  }

  // ── EventEmitter ─────────────────────────────────────────────────────────────
  function _emit(type, payload) {
    // Normalize: tüm olaylar { type, channel, payload, ts } biçiminde çıkar
    const envelope = {
      type,
      channel: payload?.channel ?? type,
      payload: payload?.payload ?? payload,
      ts:      payload?.ts      ?? Date.now(),
    };

    try { SantisEventBus?.emit?.(`ws:${type}`, envelope); } catch (_) {}

    (_listeners.get(type) ?? new Set()).forEach(cb => {
      try { cb(envelope); } catch (e) { console.error('[WS] Listener hatası:', e); }
    });
    (_listeners.get('*') ?? new Set()).forEach(cb => {
      try { cb(envelope); } catch (e) {}
    });
  }

  // ── Heartbeat ────────────────────────────────────────────────────────────────
  function _startHeartbeat() {
    _stopHeartbeat();
    _missedPongs = 0;
    _heartbeatTimer = setInterval(() => {
      if (!_socket || _socket.readyState !== WebSocket.OPEN) return;

      // Arka planda iken toleransı genişlet
      const limit = document.visibilityState === 'hidden'
        ? WS_CFG.heartbeatLimit + WS_CFG.visibilitySlack
        : WS_CFG.heartbeatLimit;

      _missedPongs++;
      if (_missedPongs > limit) {
        console.warn('[WS] Heartbeat timeout — yeniden bağlanıyor.');
        _socket.close(4001, 'heartbeat-timeout');
        return;
      }

      _socket.send(JSON.stringify({ type: 'PING', ts: Date.now() }));
      _dbg.lastPingAt = Date.now();
      _syncDebug();
    }, WS_CFG.heartbeatMs);
  }
  function _stopHeartbeat() {
    clearInterval(_heartbeatTimer);
    _heartbeatTimer = null;
  }

  // ── Channel Diffing ───────────────────────────────────────────────────────────
  function _flushPendingChannels() {
    if (!_socket || _socket.readyState !== WebSocket.OPEN) return;
    const missing = [..._pendingChannels].filter(c => !_activeChannels.has(c));
    if (!missing.length) return;

    _socket.send(JSON.stringify({ type: 'SUBSCRIBE', channels: missing }));
    missing.forEach(c => { _activeChannels.add(c); _pendingChannels.delete(c); });
    console.log('[WS] Yeni kanallar subscribe edildi:', missing);
    _syncDebug();
  }

  // ── Mesaj Gelen ───────────────────────────────────────────────────────────────
  function _onMessage(raw) {
    let p;
    try { p = JSON.parse(raw); } catch { return; }

    if (p.type === 'PONG') {
      _missedPongs = 0;
      _dbg.lastPongAt = Date.now();
      _syncDebug();
      return;
    }
    if (p.type === 'SUBSCRIBE_ACK') {
      console.log('[WS] SUBSCRIBE_ACK:', p.channels);
      return;
    }

    _emit(p.type, p);
  }

  // ── Bağlantı Aç ──────────────────────────────────────────────────────────────
  function _connect(opts = {}) {
    // Zaten açık veya açılıyor → sadece kanal diffing yap
    if (_socket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(_socket.readyState)) {
      console.warn('[WS] Aktif bağlantı var — duplicate engellendi. Kanallar diff\'leniyor.');
      _flushPendingChannels();
      return;
    }

    _connectOpts    = opts;
    _intentional    = false;
    _subscribed     = false;
    _activeChannels = new Set();
    const url       = opts.url || WS_CFG.url;

    console.log(`[WS] Bağlanıyor → ${url}`);
    _socket = new WebSocket(url);
    _syncDebug();

    // onopen ─────────────────────────────────────────────────────────────────
    _socket.onopen = () => {
      _retryCount = 0;
      _startHeartbeat();

      if (!_subscribed) {
        _subscribed = true;
        _socket.send(JSON.stringify({
          type:      'HELLO',
          role:      opts.role      || 'watcher',
          source:    opts.source    || 'santis-ws-manager',
          sessionId: opts.sessionId || _genId(),
          ts:        Date.now(),
        }));

        // Pending kanalları gönder
        const channels = [..._pendingChannels];
        if (channels.length) {
          _socket.send(JSON.stringify({ type: 'SUBSCRIBE', channels }));
          channels.forEach(c => { _activeChannels.add(c); _pendingChannels.delete(c); });
        }
      }

      _emit('CONNECTED', { ts: Date.now() });
      console.log('[WS] ✅ Bağlantı kuruldu.');
      _syncDebug();
    };

    // onmessage ──────────────────────────────────────────────────────────────
    _socket.onmessage = (e) => _onMessage(e.data);

    // onerror ────────────────────────────────────────────────────────────────
    _socket.onerror = () => {
      _emit('ERROR', {});
      console.error('[WS] Socket hatası.');
      _syncDebug();
    };

    // onclose ────────────────────────────────────────────────────────────────
    _socket.onclose = (e) => {
      _stopHeartbeat();
      _emit('DISCONNECTED', { code: e.code, reason: e.reason });
      _syncDebug();

      if (_intentional) { console.log('[WS] Kasıtlı kapanış.'); return; }

      if (_retryCount >= WS_CFG.maxRetries) {
        console.error('[WS] Max retry aşıldı. Manuel müdahale gerekli.');
        _emit('DEAD', {});
        return;
      }

      const backoff = Math.min(
        WS_CFG.baseBackoffMs * (2 ** _retryCount),
        WS_CFG.maxBackoffMs
      );
      _retryCount++;
      console.warn(`[WS] Koptu. ${backoff}ms sonra retry (${_retryCount}/${WS_CFG.maxRetries})...`);
      _retryTimer = setTimeout(() => _connect(_connectOpts), backoff);
    };
  }

  // ── Yardımcı ──────────────────────────────────────────────────────────────
  function _genId() {
    return crypto?.randomUUID?.() ?? `snt-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  }

  // ── Görünürlük Köprüsü ─────────────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _socket?.readyState === WebSocket.OPEN) {
      // Sekme geri gelince hemen PING at — zombie tespiti
      _socket.send(JSON.stringify({ type: 'PING', ts: Date.now() }));
      _dbg.lastPingAt = Date.now();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════
  return {

    /**
     * Kaynak rezerve et (app veya feature).
     * refCount sıfırdan büyük olduğu sürece socket açık kalır.
     * @param {{ role?, source?, sessionId?, channels?, url? }} opts
     */
    acquire(opts = {}) {
      // Grace period başlamışsa → iptal et (sayfa geçişi flicker koruması)
      if (_graceTimer) {
        clearTimeout(_graceTimer);
        _graceTimer = null;
        console.log('[WS] Grace period iptal edildi — acquire geldi.');
      }

      _refCount++;
      _dbg.refCount = _refCount;

      (opts.channels ?? []).forEach(c => {
        if (!_activeChannels.has(c)) _pendingChannels.add(c);
      });

      if (_refCount === 1) {
        _connect(opts);
      } else {
        _flushPendingChannels();
      }
    },

    /**
     * Kaynağı serbest bırak.
     * refCount 0'a düşünce socket kapatılır.
     */
    release() {
      _refCount = Math.max(0, _refCount - 1);
      _dbg.refCount = _refCount;

      if (_refCount > 0) return; // Hala başka consumer var

      // refCount=0 ama hemen kapatma — grace period başlat.
      // Bu pencerede acquire() gelirse timer iptal olur (mount/unmount flicker önlenir).
      if (_graceTimer) clearTimeout(_graceTimer);
      _graceTimer = setTimeout(() => {
        _graceTimer = null;
        // Hala 0 ise kapat
        if (_refCount > 0) return;
        console.log('[WS] Grace period doldu — socket kapatılıyor.');
        _intentional = true;
        clearTimeout(_retryTimer);
        _stopHeartbeat();
        // CONNECTING fazındaysa önce onerror/onclose handler'ları temizle
        // böylece cleanup çakışması olmaz
        if (_socket) {
          if (_socket.readyState === WebSocket.CONNECTING) {
            _socket.onopen  = null;
            _socket.onclose = null;
            _socket.onerror = null;
          }
          _socket.close(1000, 'client-release');
          _socket = null;
        }
        _subscribed      = false;
        _activeChannels  = new Set();
        _pendingChannels = new Set();
        _syncDebug();
      }, GRACE_MS);
    },

    /**
     * Olay dinle.
     * @param {string} type   Olay tipi veya '*' (wildcard)
     * @param {Function} cb
     * @returns {Function}    Unsubscribe fn
     */
    on(type, cb) {
      if (!_listeners.has(type)) _listeners.set(type, new Set());
      _listeners.get(type).add(cb);
      return () => _listeners.get(type)?.delete(cb);
    },

    /**
     * Mesaj gönder (sadece OPEN iken).
     */
    send(payload) {
      if (_socket?.readyState === WebSocket.OPEN) {
        _socket.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
      } else {
        console.warn('[WS] send() — socket kapalı, mesaj atıldı:', payload);
      }
    },

    /**
     * Hard reset (logout / app shutdown).
     * Tüm ref'leri sıfırlar, socket'i kapatır.
     */
    terminate() {
      // Grace timer'ı kes (bekleyen release'i geç — force close)
      if (_graceTimer) { clearTimeout(_graceTimer); _graceTimer = null; }

      _refCount    = 0;
      _intentional = true;
      clearTimeout(_retryTimer);
      _stopHeartbeat();

      // CONNECTING fazındaysa handler'ları temizle — cleanup çakışması önlenir
      if (_socket) {
        if (_socket.readyState === WebSocket.CONNECTING) {
          _socket.onopen  = null;
          _socket.onclose = null;
          _socket.onerror = null;
        }
        _socket.close(1000, 'client-terminate');
        _socket = null;
      }

      _subscribed      = false;
      _activeChannels  = new Set();
      _pendingChannels = new Set();
      _syncDebug();
      console.log('[WS] Hard terminate — tüm refCount sıfırlandı.');
    },

    /** Anlık durum */
    get state()    { return _readyLabel(); },
    get refCount() { return _refCount; },
    get channels() { return [..._activeChannels]; },
  };

})();

export const SantisWS = window.__SANTIS_WS__;
export default SantisWS;
