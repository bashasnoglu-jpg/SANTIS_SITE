import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as auditSchema from './schema/audit-logs.js';
import * as guestMemorySchema from './schema/guest-memory.js';

const schema = { ...auditSchema, ...guestMemorySchema };

/**
 * Creates a Drizzle database connection using postgres.js.
 * @param connectionString The Postgres connection string (DATABASE_URL)
 */
export function createDbConnection(connectionString: string) {
  // Disable prefetch as recommended for connection pooling (like Supabase)
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}
