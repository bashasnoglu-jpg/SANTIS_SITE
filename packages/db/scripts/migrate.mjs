import pg from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/sovereign";

const pool = new pg.Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

const statements = `
create extension if not exists pgcrypto;

create table if not exists event_store (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  aggregate_id text not null,
  payload jsonb not null,
  trace_id text not null,
  occurred_at timestamp not null,
  created_at timestamp not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  type text not null,
  subject text not null,
  payload jsonb not null,
  created_at timestamp not null default now()
);

create table if not exists booking_projection (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  tenant_id text not null,
  current_intent text not null,
  last_updated timestamp not null
);

create table if not exists outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  status text not null,
  trace_id text not null,
  created_at timestamp not null default now(),
  published_at timestamp
);

create table if not exists guest_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  guest_id text not null,
  session_id text not null unique,
  state jsonb not null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists intent_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  intent text,
  mood jsonb,
  hesitation_index text,
  payload jsonb,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists mood_read_models (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null,
  mood text not null,
  occurred_at timestamp not null
);

create table if not exists boardroom_read_models (
  id uuid primary key default gen_random_uuid(),
  scope text not null unique,
  state jsonb not null,
  updated_at timestamp not null default now()
);

create table if not exists wave_memory (
  key text primary key,
  total integer not null default 0,
  success integer not null default 0,
  updated_at timestamp not null
);
`;

try {
  await pool.query(statements);
  const result = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
  );
  console.log(
    `[db:migrate] Schema ready. Tables: ${result.rows
      .map((row) => row.table_name)
      .join(", ")}`
  );
} finally {
  await pool.end();
}
