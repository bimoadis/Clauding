import { pgTable, uuid, text, integer, boolean, timestamp, bigint, customType } from 'drizzle-orm/pg-core';

// Custom pgvector type for vector embeddings
const vector = customType<{ data: number[]; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.replace(/[\[\]]/g, '').split(',').map(Number);
  }
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  wallet: text('wallet').unique().notNull(),
  handle: text('handle'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  prefix: text('prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  scopes: text('scopes').array().notNull().default([]),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isBuiltin: boolean('is_builtin').default(false).notNull(),
  latestVersion: integer('latest_version').default(1).notNull(),
  moderation: text('moderation').default('approved').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const characterVersions = pgTable('character_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  config: text('config').notNull(), // JSON string configuration
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  latestVersion: integer('latest_version').default(1).notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const agentVersions = pgTable('agent_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  spec: text('spec').notNull(), // JSON string spec configurations
  characterVersionId: uuid('character_version_id').references(() => characterVersions.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentVersionId: uuid('agent_version_id').notNull().references(() => agentVersions.id),
  threadId: uuid('thread_id').references(() => threads.id, { onDelete: 'set null' }),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  status: text('status').default('running').notNull(),
  trigger: text('trigger').default('chat').notNull(),
  holdMicroUsd: bigint('hold_micro_usd', { mode: 'bigint' }).default(0n).notNull(),
  costMicroUsd: bigint('cost_micro_usd', { mode: 'bigint' }).default(0n).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true })
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(), // JSON string supporting rich texts/tool payload
  runId: uuid('run_id').references(() => runs.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const runSteps = pgTable('run_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  idx: integer('idx').notNull(),
  kind: text('kind').notNull(),
  model: text('model'),
  input: text('input'),
  output: text('output'),
  usage: text('usage'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const memoryChunks = pgTable('memory_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }),
  threadId: uuid('thread_id').references(() => threads.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const wallets = pgTable('wallets', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  balanceMicroUsd: bigint('balance_micro_usd', { mode: 'bigint' }).default(0n).notNull(),
  kirbleBalance: bigint('kirble_balance', { mode: 'bigint' }).default(0n).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  kind: text('kind').notNull(),
  amountMicroUsd: bigint('amount_micro_usd', { mode: 'bigint' }).notNull(),
  refType: text('ref_type'),
  refId: uuid('ref_id'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const deposits = pgTable('deposits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  asset: text('asset').notNull(),
  txSignature: text('tx_signature').unique().notNull(),
  amountNative: bigint('amount_native', { mode: 'bigint' }).notNull(),
  creditedMicroUsd: bigint('credited_micro_usd', { mode: 'bigint' }).notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const usageEvents = pgTable('usage_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  runId: uuid('run_id').references(() => runs.id, { onDelete: 'set null' }),
  model: text('model').notNull(),
  inputTokens: bigint('input_tokens', { mode: 'bigint' }).notNull(),
  outputTokens: bigint('output_tokens', { mode: 'bigint' }).notNull(),
  cacheTokens: bigint('cache_tokens', { mode: 'bigint' }).default(0n).notNull(),
  costMicroUsd: bigint('cost_micro_usd', { mode: 'bigint' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const modelCatalog = pgTable('model_catalog', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  displayName: text('display_name').notNull(),
  inPriceMicroUsd: bigint('in_price_micro_usd', { mode: 'bigint' }).notNull(),
  outPriceMicroUsd: bigint('out_price_micro_usd', { mode: 'bigint' }).notNull(),
  cachePriceMicroUsd: bigint('cache_price_micro_usd', { mode: 'bigint' }),
  contextTokens: integer('context_tokens').notNull(),
  capabilities: text('capabilities').array().notNull().default([]),
  qualityRank: integer('quality_rank').default(100).notNull(),
  enabled: boolean('enabled').default(true).notNull()
});
