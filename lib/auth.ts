import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const cookieName = 'rpm_session';
function key() {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 32) throw new Error('APP_SECRET must contain at least 32 characters.');
  return new TextEncoder().encode(secret);
}
export type Session = { userId: number; name: string; email: string; role: 'student' | 'admin' };
export async function setSession(session: Session) {
  const token = await new SignJWT(session).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(key());
  (await cookies()).set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
}
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, key()); if (!payload.userId) return null; return payload as unknown as Session; } catch { return null; }
}
export async function clearSession() { (await cookies()).delete(cookieName); }
