import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRatio,
} from '../format';

describe('format', () => {
  describe('formatNumber', () => {
    it('deve usar separador de milhar do pt-BR', () => {
      expect(formatNumber(103732)).toBe('103.732');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatRatio', () => {
    it('deve exibir a fração como percentual com duas casas', () => {
      expect(formatRatio(0.02)).toBe('2,00%');
      expect(formatRatio(0.003)).toBe('0,30%');
      expect(formatRatio(0.18)).toBe('18,00%');
    });
  });

  describe('formatPercent', () => {
    it('deve converter a fração em largura de barra', () => {
      expect(formatPercent(0.25)).toBe('25%');
      expect(formatPercent(0)).toBe('0%');
    });

    it('deve limitar a barra em 100% quando a meta é superada', () => {
      expect(formatPercent(3.5)).toBe('100%');
    });

    it('deve devolver 0% quando a meta é zero e a divisão não é finita', () => {
      expect(formatPercent(0 / 0)).toBe('0%');
      expect(formatPercent(1 / 0)).toBe('0%');
    });
  });

  describe('formatDateTime', () => {
    it('deve interpretar a data guardada como UTC', () => {
      expect(formatDateTime('2026-09-21 12:00:00')).toBe(
        new Date(Date.UTC(2026, 8, 21, 12, 0, 0)).toLocaleString('pt-BR'),
      );
    });

    it('deve exibir data e hora no formato pt-BR', () => {
      expect(formatDateTime('2026-09-21 12:00:00')).toMatch(
        /^\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}:\d{2}$/,
      );
    });
  });
});
