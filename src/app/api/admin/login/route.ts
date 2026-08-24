import {NextResponse} from 'next/server';
import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
} from '@/lib/session';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({error: 'Senha inválida.'}, {status: 401});
  }

  const response = NextResponse.json({ok: true});
  response.cookies.set(
    SESSION_COOKIE,
    createSessionToken(),
    getSessionCookieOptions(),
  );
  return response;
}
