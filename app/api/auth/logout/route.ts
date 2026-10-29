import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/http';
export async function POST(request: Request) { if (!(await isSameOrigin(request))) return NextResponse.json({ error:'Invalid request origin.' },{status:403}); await clearSession(); return NextResponse.json({ ok:true }); }
