import {createSignatureToken, hashSignatureToken} from '../signatureToken';

describe('signatureToken', () => {
  it('deve criar token hexadecimal de 64 caracteres', () => {
    expect(createSignatureToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('deve criar um token diferente a cada chamada', () => {
    expect(createSignatureToken()).not.toBe(createSignatureToken());
  });

  it('deve gerar sempre o mesmo hash para o mesmo token', () => {
    const token = createSignatureToken();

    expect(hashSignatureToken(token)).toBe(hashSignatureToken(token));
  });

  it('não deve permitir recuperar o token a partir do hash', () => {
    const token = createSignatureToken();

    const hash = hashSignatureToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(token);
  });
});
