import {parseUtc} from './signature';
import type {SignatureRequest, SignatureRequestData} from './types';

export const SIGNATURE_REQUEST_TTL_MS = 48 * 60 * 60 * 1000;

export const SIGNATURE_REQUEST_RESEND_INTERVAL_MS = 60 * 1000;

export const isSignatureRequestExpired = (
  expiresAt: string,
  now: string,
): boolean => parseUtc(now) > parseUtc(expiresAt);

export const shouldResendConfirmation = (
  request: SignatureRequest | null,
  data: SignatureRequestData,
  now: string,
): boolean =>
  !request ||
  request.status !== 'pending' ||
  request.name !== data.name ||
  request.cpf !== data.cpf ||
  request.city !== data.city ||
  parseUtc(now) - parseUtc(request.createdAt) >=
    SIGNATURE_REQUEST_RESEND_INTERVAL_MS;
