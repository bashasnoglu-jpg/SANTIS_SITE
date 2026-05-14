/**
 * server/core/telemetry-store.ts
 * Uçucu RAM listesini kalıcı disk akışına bağlar.
 */
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import type { SovereignEnvelope } from './telemetry.ts';

const STORAGE_DIR = path.resolve(process.cwd(), 'storage');
const TELEMETRY_STORAGE_PATH = path.join(STORAGE_DIR, 'sovereign_telemetry.jsonl');

// Klasör yoksa bootstrap et
if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true });
}

export const TelemetryStore = {
    ingest(envelope: SovereignEnvelope) {
        try {
            const entry = JSON.stringify(envelope) + '\n';
            appendFileSync(TELEMETRY_STORAGE_PATH, entry);
            return true;
        } catch (error) {
            console.error("[TELEMETRY_STATION]: Disk Write Failure!", error);
            return false;
        }
    }
};
