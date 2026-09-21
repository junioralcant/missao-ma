import crypto from 'crypto';
import type {EntryHashInput} from './types';

const RECEIPT_LENGTH = 10;

const RECEIPT_PREFIX = 'PEC';

const UNKNOWN_IP = 'desconhecido';

const getSecret = (): string =>
  process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'pec-maranhao';

const digest = (value: string): string =>
  crypto.createHmac('sha256', getSecret()).update(value).digest('hex');

export const buildReceipt = (cpf: string): string =>
  `${RECEIPT_PREFIX}-${digest(`receipt:${cpf}`)
    .toUpperCase()
    .slice(0, RECEIPT_LENGTH)}`;

export const hashIp = (ip: string): string => digest(`ip:${ip}`);

export const GENESIS_HASH = '';

const sha256 = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

export const buildEntryHash = (input: EntryHashInput): string =>
  sha256(
    [
      input.prevHash,
      input.name,
      input.cpf,
      input.city,
      input.proposalHash,
      input.documentHash,
      input.consentText,
      input.readingText,
      input.createdAt,
    ].join('|'),
  );

export const buildProposalHash = (
  title: string,
  summary: string,
  documentUrl: string,
  documentHash: string,
): string => sha256([title, summary, documentUrl, documentHash].join('|'));

const toUtcDateTime = (date: Date): string =>
  date.toISOString().slice(0, 19).replace('T', ' ');

export const nowUtc = (): string => toUtcDateTime(new Date());

export const utcAfter = (milliseconds: number): string =>
  toUtcDateTime(new Date(Date.now() + milliseconds));

export const parseUtc = (utcDateTime: string): number =>
  new Date(`${utcDateTime.replace(' ', 'T')}Z`).getTime();

export const readClientIp = (headers: Headers): string => {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers.get('x-real-ip')?.trim() || UNKNOWN_IP;
};
