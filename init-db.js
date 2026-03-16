const db = require('./backend/src/db/titanium');

async function initDB() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS aurelia_strikes (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) NOT NULL,
                action VARCHAR(255) DEFAULT 'VIP_INTERVENTION',
                reason VARCHAR(255),
                revenue_saved_eur INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("💎 [Titanium] Table 'aurelia_strikes' is ready and secured.");
        process.exit(0);
    } catch (err) {
        console.error("🛑 [Titanium] Failed to initialize table:", err);
        process.exit(1);
    }
}

initDB();
