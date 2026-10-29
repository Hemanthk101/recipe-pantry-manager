import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jsonError, isSameOrigin } from '@/lib/http';
import { registerSchema } from '@/lib/validation';
import { setSession } from '@/lib/auth';
export async function POST(request: Request) {
  if (!(await isSameOrigin(request))) return jsonError('Invalid request origin.', 403);
  const input = registerSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return jsonError(input.error.issues[0]?.message ?? 'Invalid registration details.');
  try {
    const hash = await bcrypt.hash(input.data.password, 12);
    const result = await query<{ user_id: number; name: string; email: string; role: 'student' }>(`INSERT INTO users(name,email,password_hash,role) VALUES($1,LOWER($2),$3,'student') RETURNING user_id,name,email,role`, [input.data.name, input.data.email, hash]);
    const row = result.rows[0]; const user = { userId: row.user_id, name: row.name, email: row.email, role: row.role };
    await setSession(user); return NextResponse.json({ user }, { status: 201 });
  } catch (e) { if ((e as { code?: string }).code === '23505') return jsonError('That email is already registered.', 409); console.error(e); return jsonError('Could not create account.', 500); }
}
