import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { db } from './db';
import { sql } from 'drizzle-orm';

async function syncDb() {
  console.log('--- Syncing Database Schema (Adding nonces table) ---');
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS nonces (
        nonce text PRIMARY KEY,
        wallet text NOT NULL,
        expires_at timestamp with time zone NOT NULL
      );
    `);
    console.log('✅ successfully verified/created nonces table in PostgreSQL.');
  } catch (err: any) {
    console.error('❌ Failed to run SQL migration:', err.message);
  }
  process.exit(0);
}

syncDb();
