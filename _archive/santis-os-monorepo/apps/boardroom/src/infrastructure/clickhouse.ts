import { createClient } from '@clickhouse/client';

/**
 * L7 Boardroom için ClickHouse Analitik Veritabanı İstemcisi.
 * OLAP sorgularında milisaniyeler (ms) seviyesinde yanıt almak ve
 * SSOT (Event Sourcing) raw datalarını yığmak (ingest) için konfigüre edilmiştir.
 */
export const clickhouse = createClient({
  host: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: 'default',
  request_timeout: 30_000,
  tls_reject_unauthorized: false // Yerel test için
});
