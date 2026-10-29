import { Pool } from 'pg';

const globalForPool = globalThis as unknown as { pool?: Pool };
export const db = globalForPool.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
});
if (process.env.NODE_ENV !== 'production') globalForPool.pool = db;

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, values: unknown[] = []) {
  return db.query<T>(sql, values);
}
