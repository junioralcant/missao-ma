import {verifySignatureChain} from '../integrity';
import {GENESIS_HASH, buildEntryHash} from '../signature';
import type {SignatureEntry} from '../types';

const buildChain = (count: number): SignatureEntry[] => {
  const entries: SignatureEntry[] = [];
  let prevHash = GENESIS_HASH;

  for (let index = 1; index <= count; index += 1) {
    const base = {
      prevHash,
      name: `Eleitor ${index}`,
      cpf: `0000000000${index}`,
      city: 'São Luís',
      proposalHash: 'hash-da-proposta',
      documentHash: 'hash-do-docx',
      consentText: 'Declaro que sou eleitor.',
      readingText: 'Declaro que li a íntegra.',
      createdAt: `2026-09-16 10:00:0${index}`,
    };
    const entryHash = buildEntryHash(base);
    entries.push({id: index, ...base, entryHash});
    prevHash = entryHash;
  }

  return entries;
};

describe('verifySignatureChain', () => {
  it('deve aceitar uma coleta vazia', () => {
    const result = verifySignatureChain([]);

    expect(result.isValid).toBe(true);
    expect(result.total).toBe(0);
    expect(result.headHash).toBe(GENESIS_HASH);
  });

  it('deve validar uma cadeia íntegra e devolver o hash final', () => {
    const entries = buildChain(3);
    const result = verifySignatureChain(entries);

    expect(result.isValid).toBe(true);
    expect(result.total).toBe(3);
    expect(result.brokenAtId).toBeNull();
    expect(result.headHash).toBe(entries[2].entryHash);
  });

  it('deve detectar alteração do município de uma assinatura', () => {
    const entries = buildChain(3);
    entries[1].city = 'Imperatriz';

    const result = verifySignatureChain(entries);

    expect(result.isValid).toBe(false);
    expect(result.brokenAtId).toBe(2);
  });

  it('deve detectar troca do texto da minuta endossado', () => {
    const entries = buildChain(3);
    entries[2].proposalHash = 'outra-minuta';

    expect(verifySignatureChain(entries).brokenAtId).toBe(3);
  });

  it('deve detectar alteração do consentimento registrado', () => {
    const entries = buildChain(2);
    entries[0].consentText = 'Outro texto';

    expect(verifySignatureChain(entries).brokenAtId).toBe(1);
  });

  it('deve detectar troca do arquivo da minuta endossado', () => {
    const entries = buildChain(3);
    entries[1].documentHash = 'outro-docx';

    expect(verifySignatureChain(entries).brokenAtId).toBe(2);
  });

  it('deve detectar alteração da declaração de leitura', () => {
    const entries = buildChain(2);
    entries[1].readingText = 'Não li nada';

    expect(verifySignatureChain(entries).brokenAtId).toBe(2);
  });

  it('deve detectar remoção de uma assinatura do meio da cadeia', () => {
    const entries = buildChain(3);
    const withoutMiddle = [entries[0], entries[2]];

    const result = verifySignatureChain(withoutMiddle);

    expect(result.isValid).toBe(false);
    expect(result.brokenAtId).toBe(3);
  });

  it('deve detectar inserção de assinatura forjada no fim', () => {
    const entries = buildChain(2);
    const forged: SignatureEntry = {
      ...entries[1],
      id: 3,
      cpf: '99999999999',
      prevHash: entries[1].entryHash,
    };

    const result = verifySignatureChain([...entries, forged]);

    expect(result.isValid).toBe(false);
    expect(result.brokenAtId).toBe(3);
  });

  it('deve detectar reordenação das assinaturas', () => {
    const entries = buildChain(3);

    expect(
      verifySignatureChain([entries[1], entries[0], entries[2]]).isValid,
    ).toBe(false);
  });
});
