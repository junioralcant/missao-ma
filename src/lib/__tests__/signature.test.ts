import {buildReceipt, hashIp, readClientIp} from '../signature';

describe('signature', () => {
  describe('buildReceipt', () => {
    it('deve gerar o mesmo protocolo para o mesmo CPF', () => {
      expect(buildReceipt('52998224725')).toBe(buildReceipt('52998224725'));
    });

    it('deve gerar protocolos diferentes para CPFs diferentes', () => {
      expect(buildReceipt('52998224725')).not.toBe(buildReceipt('11144477735'));
    });

    it('deve usar o prefixo PEC e um código legível', () => {
      expect(buildReceipt('52998224725')).toMatch(/^PEC-[0-9A-F]{10}$/);
    });

    it('não deve expor o CPF no protocolo', () => {
      expect(buildReceipt('52998224725')).not.toContain('52998224725');
    });
  });

  describe('hashIp', () => {
    it('deve ser determinístico e não reversível ao IP original', () => {
      const hash = hashIp('200.150.100.50');

      expect(hash).toBe(hashIp('200.150.100.50'));
      expect(hash).not.toContain('200.150.100.50');
      expect(hash).toHaveLength(64);
    });

    it('deve separar IPs diferentes', () => {
      expect(hashIp('200.150.100.50')).not.toBe(hashIp('200.150.100.51'));
    });
  });

  describe('readClientIp', () => {
    it('deve usar o primeiro endereço de x-forwarded-for', () => {
      const headers = new Headers({
        'x-forwarded-for': '200.150.100.50, 10.0.0.1',
      });

      expect(readClientIp(headers)).toBe('200.150.100.50');
    });

    it('deve cair para x-real-ip quando não há x-forwarded-for', () => {
      expect(readClientIp(new Headers({'x-real-ip': '10.0.0.7'}))).toBe(
        '10.0.0.7',
      );
    });

    it('deve devolver desconhecido quando nenhum cabeçalho está presente', () => {
      expect(readClientIp(new Headers())).toBe('desconhecido');
    });
  });
});
