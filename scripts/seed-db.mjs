import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import pg from 'pg';
const {Pool}=pg;
if(!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before seeding.');
const pool=new Pool({connectionString:process.env.DATABASE_URL});
try {
  await pool.query(await readFile(new URL('../db/seed.sql',import.meta.url),'utf8'));
  await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2',[await bcrypt.hash('Student123!',12),'student.demo@example.test']);
  await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2',[await bcrypt.hash('Admin123!',12),'admin.demo@example.test']);
  console.log('Demo records seeded. Local demo accounts: student.demo@example.test / Student123! and admin.demo@example.test / Admin123!');
} finally { await pool.end(); }
