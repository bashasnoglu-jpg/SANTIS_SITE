import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import postgres, { type Sql } from 'postgres';

export const INTEGRATION_GATE_NAME =
  'BOOKING-ATTEMPT-POSTGRES-INTEGRATION-ACCEPTANCE' as const;

const REQUIRED_DATABASE = 'santis_booking_attempt_gate';
const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost']);

export interface PostgresIntegrationGate {
  connectionString: string;
  sql: Sql;
  clientA: Sql;
  clientB: Sql;
  close(): Promise<void>;
}

function assertIsolatedConnection(connectionString: string): void {
  const url = new URL(connectionString);

  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`BOOKING_ATTEMPT_GATE_EXTERNAL_HOST_FORBIDDEN:${url.hostname}`);
  }

  if (url.pathname.slice(1) !== REQUIRED_DATABASE) {
    throw new Error(
      `BOOKING_ATTEMPT_GATE_DATABASE_NAME_FORBIDDEN:${url.pathname.slice(1)}`,
    );
  }

  if (process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN) {
    throw new Error('BOOKING_ATTEMPT_GATE_AIRTABLE_CREDENTIAL_FORBIDDEN');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('BOOKING_ATTEMPT_GATE_PRODUCTION_ENV_FORBIDDEN');
  }
}

async function applyExactDraftMigration(sql: Sql): Promise<void> {
  // 0003 references bookings(id). The gate intentionally creates only the minimum
  // prerequisite needed to test the exact attempt-ledger artifact. It does not run
  // historical application migrations or any production migration command.
  await sql.unsafe(`
    CREATE TABLE bookings (
      id UUID PRIMARY KEY
    );
  `);

  const migrationUrl = new URL(
    '../../../drizzle/0003_booking_attempt_ledger_v1.sql',
    import.meta.url,
  );
  const migration = await readFile(fileURLToPath(migrationUrl), 'utf8');

  if (!migration.includes('DRAFT MIGRATION ARTIFACT ONLY — DO NOT APPLY')) {
    throw new Error('BOOKING_ATTEMPT_GATE_MIGRATION_SAFETY_MARKER_MISSING');
  }

  // Explicit test-only exception: execute the exact draft artifact only against the
  // allow-listed ephemeral/local database enforced above.
  await sql.unsafe(migration);
}

export async function setupPostgresIntegrationGate(): Promise<PostgresIntegrationGate> {
  if (process.env.BOOKING_ATTEMPT_INTEGRATION_GATE !== '1') {
    throw new Error('BOOKING_ATTEMPT_INTEGRATION_GATE_NOT_AUTHORIZED');
  }

  const connectionString = process.env.BOOKING_ATTEMPT_TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error('BOOKING_ATTEMPT_TEST_DATABASE_URL_REQUIRED');
  }

  assertIsolatedConnection(connectionString);

  const sql = postgres(connectionString, { max: 4, prepare: false });
  const clientA = postgres(connectionString, { max: 1, prepare: false });
  const clientB = postgres(connectionString, { max: 1, prepare: false });

  await sql`SELECT 1`;
  await applyExactDraftMigration(sql);

  // Test-only business probe used to prove rollback scope separation.
  await sql.unsafe(`
    CREATE TABLE booking_business_probe (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      attempt_id UUID NOT NULL,
      marker TEXT NOT NULL
    );
  `);

  return {
    connectionString,
    sql,
    clientA,
    clientB,
    close: async () => {
      await Promise.all([
        clientA.end({ timeout: 1 }),
        clientB.end({ timeout: 1 }),
        sql.end({ timeout: 1 }),
      ]);
    },
  };
}
