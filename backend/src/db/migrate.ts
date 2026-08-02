import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from 'pg';

const ddl = `
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  wallet        text unique not null,
  handle        text,
  created_at    timestamptz not null default now()
);

create table if not exists api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  name          text not null,
  prefix        text not null,
  key_hash      text not null,
  scopes        text[] not null default '{}',
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_api_keys_prefix on api_keys(prefix);

create table if not exists characters (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references users(id) on delete cascade,
  name          text not null,
  is_builtin    boolean not null default false,
  latest_version int not null default 1,
  moderation    text not null default 'approved',
  created_at    timestamptz not null default now()
);

create table if not exists character_versions (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references characters(id) on delete cascade,
  version       int not null,
  config        text not null,
  created_at    timestamptz not null default now(),
  unique (character_id, version)
);

create table if not exists agents (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id) on delete cascade,
  name          text not null,
  latest_version int not null default 1,
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

create table if not exists agent_versions (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references agents(id) on delete cascade,
  version       int not null,
  spec          text not null,
  character_version_id uuid references character_versions(id),
  created_at    timestamptz not null default now(),
  unique (agent_id, version)
);

create table if not exists threads (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id) on delete cascade,
  agent_id      uuid references agents(id) on delete set null,
  title         text,
  created_at    timestamptz not null default now()
);

create table if not exists runs (
  id            uuid primary key default gen_random_uuid(),
  agent_version_id uuid not null references agent_versions(id),
  thread_id     uuid references threads(id) on delete set null,
  owner_id      uuid not null references users(id),
  status        text not null default 'running',
  trigger       text not null default 'chat',
  hold_micro_usd bigint not null default 0,
  cost_micro_usd bigint not null default 0,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create table if not exists messages (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references threads(id) on delete cascade,
  role          text not null,
  content       text not null,
  run_id        uuid references runs(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_messages_thread_created on messages(thread_id, created_at);

create table if not exists run_steps (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references runs(id) on delete cascade,
  idx           int not null,
  kind          text not null,
  model         text,
  input         text,
  output        text,
  usage         text,
  latency_ms    int,
  created_at    timestamptz not null default now(),
  unique (run_id, idx)
);

create table if not exists memory_chunks (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id) on delete cascade,
  agent_id      uuid references agents(id) on delete cascade,
  thread_id     uuid references threads(id) on delete cascade,
  content       text not null,
  created_at    timestamptz not null default now()
);

create table if not exists wallets (
  user_id       uuid primary key references users(id) on delete cascade,
  balance_micro_usd bigint not null default 0,
  kirble_balance bigint not null default 0,
  updated_at    timestamptz not null default now()
);

create table if not exists ledger_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  kind          text not null,
  amount_micro_usd bigint not null,
  ref_type      text,
  ref_id        uuid,
  metadata      text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_ledger_user_created on ledger_entries(user_id, created_at);

create table if not exists deposits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  asset         text not null,
  tx_signature  text unique not null,
  amount_native bigint not null,
  credited_micro_usd bigint not null,
  status        text not null default 'pending',
  created_at    timestamptz not null default now()
);

create table if not exists usage_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  run_id        uuid references runs(id) on delete set null,
  model         text not null,
  input_tokens  bigint not null,
  output_tokens bigint not null,
  cache_tokens  bigint not null default 0,
  cost_micro_usd bigint not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_usage_user_created on usage_events(user_id, created_at);

create table if not exists model_catalog (
  id            text primary key,
  provider      text not null,
  display_name  text not null,
  in_price_micro_usd   bigint not null,
  out_price_micro_usd  bigint not null,
  cache_price_micro_usd bigint,
  context_tokens int not null,
  capabilities  text[] not null default '{}',
  quality_rank  int not null default 100,
  enabled       boolean not null default true
);
`;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected. Running DDL script...');
    await client.query(ddl);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

main();
