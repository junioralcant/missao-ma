import {formatCpf, isValidCpf, normalizeCpf} from '../cpf';

describe('normalizeCpf', () => {
  it('deve remover tudo que não é dígito', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
  });

  it('deve truncar em 11 dígitos', () => {
    expect(normalizeCpf('529982247259999')).toBe('52998224725');
  });

  it('deve retornar vazio para entrada sem dígitos', () => {
    expect(normalizeCpf('abc')).toBe('');
  });
});

describe('formatCpf', () => {
  it('deve formatar CPF completo com pontos e traço', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });

  it('deve formatar progressivamente durante a digitação', () => {
    expect(formatCpf('529')).toBe('529');
    expect(formatCpf('5299')).toBe('529.9');
    expect(formatCpf('52998224')).toBe('529.982.24');
    expect(formatCpf('5299822472')).toBe('529.982.247-2');
  });

  it('deve reformatar entrada já formatada sem duplicar máscara', () => {
    expect(formatCpf('529.982.247-25')).toBe('529.982.247-25');
  });
});

describe('isValidCpf', () => {
  it('deve aceitar CPFs válidos', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('11144477735')).toBe(true);
  });

  it('deve aceitar CPF válido com máscara', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('deve rejeitar dígito verificador errado', () => {
    expect(isValidCpf('52998224724')).toBe(false);
    expect(isValidCpf('11144477734')).toBe(false);
  });

  it('deve rejeitar sequências de dígitos repetidos', () => {
    expect(isValidCpf('00000000000')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('deve rejeitar CPF com menos de 11 dígitos', () => {
    expect(isValidCpf('5299822472')).toBe(false);
    expect(isValidCpf('')).toBe(false);
  });
});
