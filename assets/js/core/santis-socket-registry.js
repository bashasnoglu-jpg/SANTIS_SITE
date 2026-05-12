// santis-socket-registry.js — v2.1 reconnect-hardened

const GLOBAL_KEY = '__SANTIS_SOCKET_CORE__';

// ─── Close kodları ────────────────────────────────────────────────────────────
// Server tarafı SHIELD bu kodu gönderirse client tekrar bağlanmaz.
const CLOSE_DUPLICATE_EVICTED = 4409; // "Sen zaten başka tab/instancedan bağlısın"
const CLOSE_MANUAL            = 4000;

const DEFAULT_CONFIG = {
  url: (() => {
    const token = window.SANTIS_WS_TOKEN || localStorage.getItem("SANTIS_WS_TOKEN") || "santis-dev-token";
    return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
  })(),
  reconnectBaseMs:     2_000,   // ilk bekle: 2s (önceki 1.2s çok agresifti)
  reconnectMaxMs:     30_000,   // max: 30s
  reconnectJitterMs:   1_000,   // ±1s rastgele jitter (tab senkronizasyonu kırar)
  maxReconnectAttempts: 12,     // sonrasında pes et (öncesi Infinity → storm)
  debug: true,
};

function log(...args) {
  if (window.__SANTIS_WS_DEBUG__) console.log('[SANTIS_WS]', ...args);
}

function createCore() {
  let socket           = null;
  let status           = 'idle';
  let reconnectAttempts = 0;
  let reconnectTimer   = null;
  let manuallyClosed   = false;
  let evicted          = false;   // SHIELD tarafından evict edildik mi?

  const subscriptions      = new Map();
  const globalListeners    = new Set();
  const pendingSubscriptions = new Set();
  const outboundQueue      = [];

  const instanceId = crypto?.randomUUID?.() || `ws-${Date.now()}-${Math.random()}`;

  function emitStatus(nextStatus) {
    status = nextStatus;
    globalListeners.forEach(fn => { try { fn({ type: '__STATUS__', status }); } catch {} });
  }

  function emitPacket(packet) {
    globalListeners.forEach(fn => { try { fn(packet); } catch {} });
    const channel = packet?.channel || packet?.type;
    if (!channel) return;
    const handlers = subscriptions.get(channel);
    if (!handlers) return;
    handlers.forEach(fn => { try { fn(packet); } catch {} });
  }

  function flushQueue() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    while (outboundQueue.length > 0) {
      socket.send(JSON.stringify(outboundQueue.shift()));
    }
  }

  function flushSubscriptions() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (pendingSubscriptions.size === 0) return;

    const channels = Array.from(pendingSubscriptions);
    socket.send(JSON.stringify({
      type: 'SUBSCRIBE',
      channels,
      meta: { instanceId, ts: Date.now() },
    }));

    // ✅ Gönderildikten sonra pending'i temizle (duplicate SUBSCRIBE'ı önler)
    pendingSubscriptions.clear();
    log('SUBSCRIBE sent:', channels);
  }

  function scheduleReconnect() {
    if (manuallyClosed) return;
    if (evicted)        return;   // evict edildiyse reconnect yok
    if (reconnectTimer) return;

    if (reconnectAttempts >= DEFAULT_CONFIG.maxReconnectAttempts) {
      log('Max reconnect attempts reached. Giving up.');
      emitStatus('failed');
      return;
    }

    // Exponential backoff + jitter
    const base   = DEFAULT_CONFIG.reconnectBaseMs * Math.pow(1.8, reconnectAttempts);
    const jitter = Math.random() * DEFAULT_CONFIG.reconnectJitterMs;
    const delay  = Math.min(base + jitter, DEFAULT_CONFIG.reconnectMaxMs);

    reconnectAttempts++;
    emitStatus('reconnecting');

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);

    log(`Reconnect #${reconnectAttempts} in ${Math.round(delay)}ms`);
  }

  function handleOpen() {
    reconnectAttempts = 0;
    evicted = false;
    emitStatus('open');

    send({
      type: 'HELLO',
      meta: { instanceId, app: 'santis-frontend', ts: Date.now() },
    });

    // Tüm kayıtlı kanalları pending'e tekrar ekle (reconnect'te yeniden subscribe et)
    for (const channel of subscriptions.keys()) {
      pendingSubscriptions.add(channel);
    }

    flushSubscriptions();
    flushQueue();
    log('Socket opened');
  }

  function handleMessage(event) {
    try {
      const packet = JSON.parse(event.data);
      if (packet?.type === 'SUBSCRIBE_ACK' && Array.isArray(packet.channels)) {
        log('SUBSCRIBE_ACK:', packet.channels);
      }
      emitPacket(packet);
    } catch (err) {
      log('Invalid WS payload:', err);
    }
  }

  function handleClose(event) {
    emitStatus('closed');
    log('Socket closed:', { code: event.code, reason: event.reason, wasClean: event.wasClean });

    // ✅ SHIELD eviction kodu → reconnect etme, sadece bekle
    if (event.code === CLOSE_DUPLICATE_EVICTED) {
      evicted = true;
      log('Evicted by SHIELD (4409). Not reconnecting.');
      return;
    }

    // ✅ Manuel kapatma → reconnect etme
    if (manuallyClosed || event.code === CLOSE_MANUAL) return;

    scheduleReconnect();
  }

  function handleError() {
    emitStatus('error');
    // handleClose da tetiklenecek, oradan reconnect schedule edilir
  }

  function connect() {
    if (evicted) {
      log('Evicted — will not reconnect until page reload or explicit connect()');
      return null;
    }

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return socket;
    }

    // Eski socket varsa listener'ları temizle (stale listener self-healing)
    if (socket) {
      socket.removeEventListener('open',    handleOpen);
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('close',   handleClose);
      socket.removeEventListener('error',   handleError);
    }

    manuallyClosed = false;
    emitStatus('connecting');

    socket = new WebSocket(DEFAULT_CONFIG.url);
    socket.addEventListener('open',    handleOpen);
    socket.addEventListener('message', handleMessage);
    socket.addEventListener('close',   handleClose);
    socket.addEventListener('error',   handleError);

    return socket;
  }

  function close(code = CLOSE_MANUAL, reason = 'manual_close') {
    manuallyClosed = true;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (socket && socket.readyState <= WebSocket.OPEN) socket.close(code, reason);
    emitStatus('closed');
  }

  function send(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return true;
    }
    outboundQueue.push(message);
    connect();
    return false;
  }

  function subscribe(channel, handler) {
    if (!subscriptions.has(channel)) subscriptions.set(channel, new Set());
    subscriptions.get(channel).add(handler);
    pendingSubscriptions.add(channel);

    if (socket && socket.readyState === WebSocket.OPEN) {
      flushSubscriptions();
    } else {
      connect();
    }

    return () => unsubscribe(channel, handler);
  }

  function unsubscribe(channel, handler) {
    const set = subscriptions.get(channel);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) subscriptions.delete(channel);
  }

  function onMessage(handler) {
    globalListeners.add(handler);
    return () => globalListeners.delete(handler);
  }

  function getState() {
    return {
      instanceId, status, reconnectAttempts, evicted,
      subscribedChannels: Array.from(subscriptions.keys()),
      pendingChannels:    Array.from(pendingSubscriptions),
      socketReadyState:   socket ? socket.readyState : null,
    };
  }

  return { connect, close, send, subscribe, unsubscribe, onMessage, getState };
}

if (!window[GLOBAL_KEY]) {
  window[GLOBAL_KEY] = createCore();
}

window.__SANTIS_WS_DEBUG__ = window.__SANTIS_WS_DEBUG__ ?? true;

export const SantisSocketRegistry = window[GLOBAL_KEY];
export default SantisSocketRegistry;
