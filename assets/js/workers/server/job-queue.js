/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🔵 SANTIS SERVER WORKER — BullMQ Job Queue v1.1           ║
 * ║  Rezervasyon bildirim · E-posta · AI scoring · Webhook     ║
 * ║  Stack: BullMQ + ioredis + PostgreSQL                      ║
 * ║  UI:    Bull Board → http://localhost:3002                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Çalıştırma: node workers/job-queue.js
 * Docker:     santis-worker container (docker-compose.yml)
 *
 * NOT: Bu dosya server-side Node.js'dir. Browser santis-ai.worker.js
 *      ile hiçbir ilişkisi yoktur — o tarayıcıda, bu sunucuda çalışır.
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import { createClient } from 'redis';
import pg from 'pg';

// ── Bull Board ────────────────────────────────────────────────────────────────
import { createBullBoard }      from '@bull-board/api';
import { BullMQAdapter }        from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter }       from '@bull-board/express';
import express                  from 'express';

const { Pool } = pg;

// ── Config ───────────────────────────────────────────────────────────────────
const REDIS_URL        = process.env.REDIS_URL        || 'redis://localhost:6379';
const DB_URL           = process.env.DATABASE_URL     || 'postgresql://santis:password@localhost:5432/santis_db';
const CONCURRENCY      = parseInt(process.env.WORKER_CONCURRENCY || '4');
const BOARD_PORT       = parseInt(process.env.BULL_BOARD_PORT    || '3002');
const BOARD_USER       = process.env.BULL_BOARD_USER             || 'santis';
const BOARD_PASS       = process.env.BULL_BOARD_PASS             || 'board_2026';

const connection = {
    url: REDIS_URL,
    maxRetriesPerRequest: null,  // BullMQ zorunluluğu
};

const db = new Pool({ connectionString: DB_URL });

// ── Queue Tanımları ──────────────────────────────────────────────────────────
export const queues = {
    reservation: new Queue('santis.reservation', { connection }),
    email:       new Queue('santis.email',       { connection }),
    aiScoring:   new Queue('santis.ai-scoring',  { connection }),
    webhook:     new Queue('santis.webhook',      { connection }),
};

// ── Job: Rezervasyon İşleme ───────────────────────────────────────────────────
async function processReservation(job) {
    const { guestId, serviceId, date, phone, hotelId } = job.data;
    console.log(`[Worker] 🏨 Rezervasyon işleniyor: guest=${guestId} service=${serviceId}`);

    // WhatsApp bildirim
    const msg = encodeURIComponent(
        `Rezervasyon onaylandı! Hizmet: ${serviceId}, Tarih: ${date}`
    );
    console.log(`[Worker] 📱 WhatsApp gönderiyor: ${phone} → wa.me/${phone}?text=${msg}`);

    // DB'ye rezervasyon kaydı
    await db.query(
        `UPDATE reservations SET status='confirmed', confirmed_at=NOW()
         WHERE guest_id=$1 AND service_id=$2 AND reservation_date=$3`,
        [guestId, serviceId, date]
    );

    return { status: 'confirmed', guestId, serviceId };
}

// ── Job: E-posta Kuyruğu ──────────────────────────────────────────────────────
async function processEmail(job) {
    const { to, subject, template, data } = job.data;
    console.log(`[Worker] 📧 E-posta gönderiliyor: ${to} | ${subject}`);

    // Gerçek implementasyonda: Nodemailer / Resend / SendGrid
    // await transporter.sendMail({ to, subject, html: render(template, data) });

    return { sent: true, to, subject };
}

// ── Job: AI Scoring (Server-side) ─────────────────────────────────────────────
async function processAiScoring(job) {
    const { guestId, sessionData } = job.data;
    console.log(`[Worker] 🤖 AI Scoring: guest=${guestId}`);

    const raw   = sessionData.pageViews * 0.3 + sessionData.timeOnSite * 0.5 + sessionData.clicks * 0.2;
    const score = Math.round(100 / (1 + Math.exp(-0.08 * (raw - 50))));

    await db.query(
        `INSERT INTO guest_scores (guest_id, score, computed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (guest_id) DO UPDATE SET score=$2, computed_at=NOW()`,
        [guestId, score]
    );

    console.log(`[Worker] 🧠 Score: guest=${guestId} → ${score}/100`);
    return { guestId, score };
}

// ── Job: Webhook Dispatcher ────────────────────────────────────────────────────
async function processWebhook(job) {
    const { url, payload, secret } = job.data;
    console.log(`[Worker] 🔗 Webhook: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Santis-Signature': secret || 'unsigned',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
    return { delivered: true, status: response.status };
}

// ── Worker'ları Başlat ────────────────────────────────────────────────────────
const PROCESSORS = {
    'santis.reservation': processReservation,
    'santis.email':       processEmail,
    'santis.ai-scoring':  processAiScoring,
    'santis.webhook':     processWebhook,
};

const workers = Object.entries(PROCESSORS).map(([queueName, processor]) => {
    const w = new Worker(queueName, processor, {
        connection,
        concurrency: CONCURRENCY,
    });

    w.on('completed', (job, result) => {
        console.log(`[Worker] ✅ ${queueName} | job=${job.id} | result=${JSON.stringify(result)}`);
    });

    w.on('failed', (job, err) => {
        console.error(`[Worker] ❌ ${queueName} | job=${job?.id} | err=${err.message}`);
    });

    return w;
});

// ── Bull Board Express UI ─────────────────────────────────────────────────────
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/bull-board');

createBullBoard({
    queues: Object.values(queues).map(q => new BullMQAdapter(q)),
    serverAdapter,
    options: {
        uiConfig: {
            boardTitle:    '📋 Santis Job Queue',
            boardLogo:     { path: 'https://santis-club.com/assets/img/logo.png', width: 40, height: 40 },
            miscLinks:     [{ text: '← API Docs', url: 'http://localhost:8080/api/docs' }],
            favIcon: {
                default:   'static/images/bull-dashboard-favicon.ico',
                alternative:'static/images/bull-dashboard-favicon.ico',
            },
        },
    },
});

//  Basic Auth korumas — production'da gerçek auth ile değiştirin
function basicAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token  = header.replace('Basic ', '');
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');

    if (user === BOARD_USER && pass === BOARD_PASS) {
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Santis Bull Board"');
    res.status(401).send('Yetkisiz erişim. Lütfen giriş yapın.');
}

const boardApp = express();

// Health check — Docker healthcheck ve Nginx upstream için (auth yok)
boardApp.get('/health', (_req, res) =>
    res.json({ status: 'ok', queues: Object.keys(queues), port: BOARD_PORT })
);

// Bull Board UI — basic auth korumálı
boardApp.use('/bull-board', basicAuth, serverAdapter.getRouter());

// Root redirect
boardApp.get('/', (_req, res) => res.redirect('/bull-board'));

const boardServer = boardApp.listen(BOARD_PORT, () => {
    console.log(`[Bull Board] 📋 UI aktif: http://localhost:${BOARD_PORT}/bull-board`);
    console.log(`[Bull Board] 🔐 Giriş: ${BOARD_USER} / ${BOARD_PASS}`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
    console.log(`\n[Worker] ${signal} alındı. Kapatılıyor...`);
    boardServer.close();
    await Promise.all(workers.map(w => w.close()));
    await db.end();
    process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Başlatma ──────────────────────────────────────────────────────────────────
console.log(`
╔══════════════════════════════════════════╗
║  🔵 Santis Job Queue Worker v1.1        ║
║  Queues: reservation · email ·           ║
║          ai-scoring · webhook            ║
║  Board:  http://localhost:3002           ║
╚══════════════════════════════════════════╝
`);
console.log(`[Worker] Redis: ${REDIS_URL}`);
console.log(`[Worker] Concurrency: ${CONCURRENCY}`);
console.log(`[Worker] ${workers.length} worker başlatıldı. Kuyruk bekleniyor...\n`);
