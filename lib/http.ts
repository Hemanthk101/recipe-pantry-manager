import { NextResponse } from 'next/server';
import { getSession } from './auth';
export function jsonError(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
export async function requireUser() {
  const user = await getSession();
  return user ? { user, response: null } : { user: null, response: jsonError('Sign in to continue.', 401) };
}
export async function requireAdmin() {
  const result = await requireUser();
  if (result.response) return result;
  if (result.user?.role !== 'admin') return { user: null, response: jsonError('Administrator access required.', 403) };
  return result;
}
export function validId(value: string) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : null; }
export async function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const requestHost = request.headers.get('host') || requestUrl.host;
    return originUrl.host.toLowerCase() === requestHost.toLowerCase()
      && originUrl.protocol === requestUrl.protocol;
  } catch { return false; }
}
