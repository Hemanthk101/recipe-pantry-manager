import { readFile } from 'node:fs/promises';
import pg from 'pg';
const {Pool}=pg;
if(!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running database setup.');
const pool=new Pool({connectionString:process.env.DATABASE_URL});
try { await pool.query(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8')); console.log('Schema applied.'); }
finally { await pool.end(); }
