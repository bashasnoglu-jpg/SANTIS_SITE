/**
 * db/sqlite-audit.ts
 * SQLite bağlantı singleton'ı.
 * better-sqlite3 kullanır (sync API — Node.js thread'ini bloklamaz çünkü
 * SQLite I/O zaten ultra hızlıdır ve WAL modu concurrent okumaya izin verir).
 *
 * Kurulum: npm install better-sqlite3 @types/better-sqlite3
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH   = process.env.AUDIT_DB_PATH ?? join(__dirname, '../../data/santis-audit.db');
const SCHEMA    = join(__dirname, 'audit-schema.sql');

// ─── Singleton ────────────────────────────────────────────────────────────────
let _db: Database.Database | null = null;

export function getAuditDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH, {
    // verbose: process.env.NODE_ENV !== 'production' ? console.log : undefined,
  });

  // WAL + performans ayarları
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');  // WAL modunda güvenli ve hızlı
  _db.pragma('cache_size = -16000');   // 16 MB önbellek
  _db.pragma('temp_store = MEMORY');

  // Schema yoksa oluştur
  const schema = readFileSync(SCHEMA, 'utf8');
  _db.exec(schema);

  console.log(`[AuditDB] SQLite bağlandı → ${DB_PATH}`);

  // Graceful shutdown
  process.once('exit',    () => _db?.close());
  process.once('SIGINT',  () => { _db?.close(); process.exit(0); });
  process.once('SIGTERM', () => { _db?.close(); process.exit(0); });

  return _db;
}
