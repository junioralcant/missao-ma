import {GENESIS_HASH, buildEntryHash} from './signature';
import type {ChainVerification, SignatureEntry} from './types';

export const verifySignatureChain = (
  entries: SignatureEntry[],
): ChainVerification => {
  let prevHash = GENESIS_HASH;

  for (const entry of entries) {
    const expected = buildEntryHash({
      prevHash,
      name: entry.name,
      cpf: entry.cpf,
      city: entry.city,
      proposalHash: entry.proposalHash,
      documentHash: entry.documentHash,
      consentText: entry.consentText,
      readingText: entry.readingText,
      createdAt: entry.createdAt,
    });
    if (entry.prevHash !== prevHash || entry.entryHash !== expected) {
      return {
        total: entries.length,
        isValid: false,
        brokenAtId: entry.id,
        headHash: prevHash,
      };
    }
    prevHash = entry.entryHash;
  }

  return {
    total: entries.length,
    isValid: true,
    brokenAtId: null,
    headHash: prevHash,
  };
};
