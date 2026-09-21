import crypto from 'crypto';

const TOKEN_BYTES = 32;

export const createSignatureToken = (): string =>
  crypto.randomBytes(TOKEN_BYTES).toString('hex');

export const hashSignatureToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');
