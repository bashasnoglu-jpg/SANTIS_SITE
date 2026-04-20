// santis-ws-gateway.js — v3.0
// Sovereign OS — WebSocket Telemetry Gateway
// v3: SQLite persistence + operator identity + incident lifecycle

const WebSocket = require('ws');
const http      = require('http');
const fs        = require('fs');
const path      = require('path');

// DB (better-sqlite3 kurulmadıysa JSONL fallback'e geç)
let db;
try {
  db = require('./db/santis-db');
  console.log('[DB] ✅ SQLite bağlantısı kuruldu');
} catch (e) {
  console.warn('[DB] ⚠️  better-sqlite3 bulunamadı — JSONL fallback aktif');
  db = null;
}

// ─── Yapılandırma ─────────────────────────────────────────────────────────────
const PORT         = process.env.WS_PORT  || 8080;
const SECRET_TOKEN = process.env.WS_TOKEN || 'SANTIS-CORE-TX99';
const AUDIT_FILE   = path.join(__dirname, 'logs', 'operator-audit.jsonl');
const SCHEMA_VERSION = 1;

// Audit log klasörünü oluştur
fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });

// ─── İzin verilen paket tipleri ───────────────────────────────────────────────
const EMITTER_TYPES = ['THREAT_PULSE', 'ORBITAL_STREAM', 'DEGRADATION_WARN', 'PING', 'INIT'];
const VALID_ACTIONS = ['ACK', 'MUTE', 'ESCALATE', 'RESOLVE']; // RESOLVE eklendi

// ─── Sunucu ───────────────────────────────────────────────────────────────────
// ─── HTTP Sunucusu (/audit endpoint dahil) ───────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // GET /audit — SQLite varsa oradan, yoksa JSONL
  if (req.method === 'GET' && req.url === '/audit') {
    if (db) {
      try {
        const rows = db.getAllAudit();
        res.writeHead(200); res.end(JSON.stringify(rows)); return;
      } catch (e) { console.error('[DB] /audit sorgu hatası:', e.message); }
    }
    // JSONL fallback
    fs.readFile(AUDIT_FILE, 'utf8', (err, data) => {
      if (err && err.code === 'ENOENT') { res.writeHead(200); res.end('[]'); return; }
      if (err) { res.writeHead(500); res.end(JSON.stringify({ error: 'Read error' })); return; }
      const entries = data.split('\n').filter(Boolean).reduce((acc, l) => {
        try { acc.push(JSON.parse(l)); } catch {}
        return acc;
      }, []);
      res.writeHead(200); res.end(JSON.stringify(entries));
    });
    return;
  }

  // GET /incidents — tüm incident durumları
  if (req.method === 'GET' && req.url === '/incidents') {
    if (!db) { res.writeHead(503); res.end(JSON.stringify({ error: 'SQLite aktif değil' })); return; }
    try {
      const rows = db.getAllIncidents();
      res.writeHead(200); res.end(JSON.stringify(rows)); return;
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); return; }
  }

  // GET /incidents/open — çözümlenmemiş incident'ler
  if (req.method === 'GET' && req.url === '/incidents/open') {
    if (!db) { res.writeHead(503); res.end(JSON.stringify({ error: 'SQLite aktif değil' })); return; }
    try {
      const rows = db.getOpenIncidents();
      res.writeHead(200); res.end(JSON.stringify(rows)); return;
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); return; }
  }

  res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' }));
});

const wss = new WebSocket.Server({ server });
const clients = new Map(); // ws → { role, connectedAt, ip }

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

/** Tüm watcher'lara mesaj yayınlar (gönderen hariç) */
function broadcastToWatchers(data, exclude = null) {
  wss.clients.forEach((client) => {
    const info = clients.get(client);
    if (client !== exclude && client.readyState === WebSocket.OPEN && info?.role === 'watcher') {
      client.send(data);
    }
  });
}

/** OPERATOR_ACTION paketini normalize eder — v1.1 identity alanları dahil */
function normalizeOperatorAction(packet) {
  return {
    type:          'OPERATOR_ACTION',
    schemaVersion: SCHEMA_VERSION,
    action:        packet.action,
    targetEventId: packet.targetEventId,
    operatorId:    packet.operatorId    || 'local-operator',
    operatorName:  packet.operatorName  || 'Anonim Operatör',
    operatorRole:  packet.operatorRole  || 'watcher',
    sessionId:     packet.sessionId     || null,
    source:        packet.source        || 'gods-eye-ui',
    timestamp:     packet.timestamp     || Date.now(),
    processedAt:   Date.now(),
  };
}

/** Audit log'a satır yazar (JSON Lines formatı) */
function writeAudit(entry) {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFile(AUDIT_FILE, line, (err) => {
    if (err) console.error('[AUDIT] Yazma hatası:', err.message);
  });
}

// ─── Reject Rate Limiter ───────────────────────────────────────────────────────
// Aynı IP'den gelen yetkisiz bağlantılar 10s pencerede max 3 kez loglanır.
// Sonraki denemeler sessizce drop edilir — terminal spam önleme.
const rejectLog = new Map(); // ip → { count, windowStart }
const REJECT_WINDOW_MS  = 10_000;
const REJECT_LOG_MAX    = 3;

function shouldLogReject(ip) {
  const now  = Date.now();
  const prev = rejectLog.get(ip);

  if (!prev || now - prev.windowStart > REJECT_WINDOW_MS) {
    rejectLog.set(ip, { count: 1, windowStart: now });
    return true;
  }

  prev.count += 1;
  if (prev.count === REJECT_LOG_MAX + 1) {
    console.warn(`[THREAT] ${ip} — tekrar eden yetkisiz bağlantılar, bundan sonra sessiz drop.`);
  }
  return prev.count <= REJECT_LOG_MAX;
}

// ─── Bağlantı İşleyici ────────────────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  const url   = new URL(req.url, `http://${req.headers.host}`);
  const role  = url.searchParams.get('role');
  const token = url.searchParams.get('token');
  const ip    = req.socket.remoteAddress;

  // Zero-Trust: Token
  if (token !== SECRET_TOKEN) {
    if (shouldLogReject(ip)) {
      console.warn(`[THREAT] Yetkisiz bağlantı reddedildi. IP: ${ip}`);
    }
    ws.close(1008, 'Unauthorized');
    return;
  }

  // Rol doğrulama
  if (!['emitter', 'watcher'].includes(role)) {
    console.warn(`[THREAT] Geçersiz rol: ${role} | IP: ${ip}`);
    ws.close(1008, 'Invalid Role');
    return;
  }

  clients.set(ws, { role, ip, connectedAt: Date.now() });
  console.log(`[GATEWAY] 🟢 Bağlandı — rol: ${role} | IP: ${ip}`);

  // ── Mesaj İşleyici ──────────────────────────────────────────────────────────
  ws.on('message', (raw) => {
    let packet;
    try { packet = JSON.parse(raw); }
    catch { console.warn('[GATEWAY] Malformed JSON — dropped'); return; }

    const info = clients.get(ws);

    // EMITTER mesajları
    if (info?.role === 'emitter') {
      if (packet.type === 'PING') { ws.send(JSON.stringify({ type: 'PONG' })); return; }
      if (packet.type === 'INIT') { return; } // Kayıt için yok say

      if (EMITTER_TYPES.includes(packet.type)) {
        broadcastToWatchers(raw.toString());
      } else {
        console.warn(`[ROUTER] Emitter — bilinmeyen tip: ${packet.type}`);
      }
      return;
    }

    // WATCHER mesajları
    if (info?.role === 'watcher') {
      if (packet.type === 'PING') { ws.send(JSON.stringify({ type: 'PONG' })); return; }
      if (packet.type === 'INIT') { return; }

      // ── OPERATOR_ACTION işleme ──────────────────────────────────────────────
      if (packet.type === 'OPERATOR_ACTION') {
        if (!VALID_ACTIONS.includes(packet.action)) {
          console.warn(`[OPERATOR] Geçersiz aksiyon: ${packet.action}`);
          return;
        }

        const normalized = normalizeOperatorAction(packet);

        // 1. SQLite'a yaz (varsa), JSONL'ye de yaz (immutable fallback)
        if (db) {
          try {
            const { newState } = db.writeOperatorAction(normalized);
            normalized.resolvedState = newState;
          } catch (e) {
            console.error('[DB] Yazma hatası:', e.message);
          }
        }
        writeAudit(normalized); // JSONL her zaman

        console.log(`[OPERATOR] ${normalized.action} → evt:${normalized.targetEventId} | op:${normalized.operatorId} (${normalized.operatorName}) | state:${normalized.resolvedState ?? '—'}`);

        // 2. Diğer watcher'lara broadcast et
        broadcastToWatchers(JSON.stringify(normalized), ws);
        return;
      }

      console.warn(`[ROUTER] Watcher — yetkisiz tip: ${packet.type}`);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[GATEWAY] 🔴 Bağlantı kapandı — rol: ${role}`);
  });
});

// ─── Hata Yönetimi ────────────────────────────────────────────────────────────
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} zaten kullanımda!`);
    console.error(`   PowerShell: Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force\n`);
  } else {
    console.error('[GATEWAY] Sunucu hatası:', err.message);
  }
  process.exit(1);
});

wss.on('error', (err) => console.error('[GATEWAY] WSS hatası:', err.message));

server.listen(PORT, () => {
  console.log(`[SANTIS GATEWAY v2] 🚀 Port ${PORT} — WebSocket aktif`);
  console.log(`[SANTIS GATEWAY v2] 🛡️  Zero-Trust protokolü devrede`);
  console.log(`[SANTIS GATEWAY v2] 📋 Audit log: ${AUDIT_FILE}`);
});
