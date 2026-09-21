import {
  isSignatureRequestExpired,
  shouldResendConfirmation,
} from '../signatureRequest';
import type {SignatureRequest} from '../types';

const pendingRequest: SignatureRequest = {
  id: 1,
  name: 'Maria Silva',
  cpf: '52998224725',
  email: 'maria@exemplo.com',
  city: 'São Luís',
  status: 'pending',
  ipHash: 'hash',
  userAgent: 'jest',
  proposalHash: 'proposta',
  documentHash: 'documento',
  consentText: 'consentimento',
  readingText: 'leitura',
  createdAt: '2026-09-21 10:00:00',
  expiresAt: '2026-09-23 10:00:00',
  confirmedAt: null,
  receipt: null,
};

const sameData = {
  name: 'Maria Silva',
  cpf: '52998224725',
  city: 'São Luís',
};

describe('signatureRequest', () => {
  describe('isSignatureRequestExpired', () => {
    it('deve considerar válido o pedido dentro do prazo', () => {
      expect(
        isSignatureRequestExpired('2026-09-23 10:00:00', '2026-09-22 09:00:00'),
      ).toBe(false);
    });

    it('deve considerar expirado o pedido após o prazo', () => {
      expect(
        isSignatureRequestExpired('2026-09-23 10:00:00', '2026-09-23 10:00:01'),
      ).toBe(true);
    });
  });

  describe('shouldResendConfirmation', () => {
    it('deve enviar quando não existe pedido anterior', () => {
      expect(
        shouldResendConfirmation(null, sameData, '2026-09-21 10:00:10'),
      ).toBe(true);
    });

    it('não deve reenviar quando o mesmo cadastro é repetido em seguida', () => {
      expect(
        shouldResendConfirmation(
          pendingRequest,
          sameData,
          '2026-09-21 10:00:30',
        ),
      ).toBe(false);
    });

    it('deve reenviar quando algum dado do cadastro muda', () => {
      expect(
        shouldResendConfirmation(
          pendingRequest,
          {...sameData, city: 'Imperatriz'},
          '2026-09-21 10:00:10',
        ),
      ).toBe(true);
    });

    it('deve reenviar quando o intervalo mínimo já passou', () => {
      expect(
        shouldResendConfirmation(
          pendingRequest,
          sameData,
          '2026-09-21 10:01:00',
        ),
      ).toBe(true);
    });

    it('deve enviar novo pedido quando o anterior já foi confirmado', () => {
      expect(
        shouldResendConfirmation(
          {...pendingRequest, status: 'confirmed'},
          sameData,
          '2026-09-21 10:00:10',
        ),
      ).toBe(true);
    });
  });
});
