import crypto from 'crypto';
import {cookies} from 'next/headers';

export const SESSION_COOKIE = 'admin_session';

const SESSION_PAYLOAD = 'admin';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const getSecret = (): string =>
  process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';

export const createSessionToken = (): string => {
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(SESSION_PAYLOAD)
    .digest('hex');
  return `${SESSION_PAYLOAD}.${signature}`;
};

export const isValidSessionToken = (token: string | undefined): boolean => {
  if (!token || !getSecret()) {
    return false;
  }
  const expected = Buffer.from(createSessionToken());
  const received = Buffer.from(token);
  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
};

export const isAdminRequest = (): boolean =>
  isValidSessionToken(cookies().get(SESSION_COOKIE)?.value);

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
});
