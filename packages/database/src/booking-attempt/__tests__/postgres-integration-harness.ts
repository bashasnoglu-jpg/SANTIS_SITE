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

async function createTestOnlyBookingPrerequisite(sql: Sql): Promise<void> {
  // The acceptance gate intentionally does not run historical migrations. It creates
  // only the booking-state surface required to prove the attempt writer correlation.
  // Defaults keep the older constraint-only proofs valid while newer writer proofs
  // still provide explicit canonical business values.
  await sql.unsafe(`
    DO $$
    BEGIN
      CREATE TYPE booking_source AS ENUM (
        'manual', 'online', 'hotel_front_desk', 'concierge', 'phone', 'walk_in'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE booking_status AS ENUM (
        'draft', 'confirmed', 'checked_in', 'in_progress', 'completed',
        'cancelled', 'no_show'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL DEFAULT gen_random_uuid(),
      service_id UUID NOT NULL DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL DEFAULT gen_random_uuid(),
      therapist_id UUID NOT NULL DEFAULT gen_random_uuid(),
      service_start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      service_end_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
      cleanup_end_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour 15 minutes'),
      booking_source booking_source NOT NULL DEFAULT 'manual',
      booking_status booking_status NOT NULL DEFAULT 'draft',
      customer_info JSONB NOT NULL DEFAULT '{}'::jsonb,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function applyExactDraftMigration(sql: Sql): Promise<void> {
  await createTestOnlyBookingPrerequisite(sql);

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

  // The destructive reset below is unreachable until host/database/credential gates pass.
  assertIsolatedConnection(connectionString);

  const sql = postgres(connectionString, { max: 4, prepare: false });
  const clientA = postgres(connectionString, { max: 1, prepare: false });
  const clientB = postgres(connectionString, { max: 1, prepare: false });

  await sql`SELECT 1`;
  await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
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
