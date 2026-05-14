// server/santis-db-vault.js
import pg from 'pg';
const { Pool } = pg;

// Sovereign DB Connection
export const dbVault = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sovereign', // Örn: postgresql://user:pass@localhost:5432/sovereign
    max: 20, // Zero-bloat connection pooling
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

dbVault.on('connect', () => {
    console.log('[VAULT] PostgreSQL Çelik Kasası ile bağlantı kuruldu.');
});

dbVault.on('error', (err) => {
    console.error('[VAULT] Kritik Veritabanı Hatası:', err);
});
