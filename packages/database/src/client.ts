import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/audit-logs.js'; // Expand this as more schemas are added

/**
 * Creates a Drizzle database connection using postgres.js.
 * @param connectionString The Postgres connection string (DATABASE_URL)
 */
export function createDbConnection(connectionString: string) {
  // Disable prefetch as recommended for connection pooling (like Supabase)
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}
