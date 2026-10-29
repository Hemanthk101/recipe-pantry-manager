import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jsonError, isSameOrigin } from '@/lib/http';
import { loginSchema } from '@/lib/validation';
import { setSession } from '@/lib/auth';
export async function POST(request: Request) {
  if (!(await isSameOrigin(request))) return jsonError('Invalid request origin.', 403);
  const input = loginSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return jsonError('Enter a valid email and password.');
  try {
    const result = await query<{ user_id:number; name:string; email:string; role:'student'|'admin'; password_hash:string }>('SELECT user_id,name,email,role,password_hash FROM users WHERE email=LOWER($1)', [input.data.email]);
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(input.data.password, row.password_hash))) return jsonError('Email or password is incorrect.', 401);
    const user = { userId:row.user_id, name:row.name, email:row.email, role:row.role }; await setSession(user);
    return NextResponse.json({ user });
  } catch (e) { console.error(e); return jsonError('Could not sign in.', 500); }
}
