import {formatPhone, isValidPhone, normalizePhone} from '../phone';

describe('normalizePhone', () => {
  it('deve manter apenas os dígitos', () => {
    expect(normalizePhone('(98) 99988-7766')).toBe('98999887766');
  });

  it('deve remover o código do país quando informado', () => {
    expect(normalizePhone('+55 (98) 99988-7766')).toBe('98999887766');
  });

  it('deve limitar ao tamanho de um número nacional', () => {
    expect(normalizePhone('989998877669999')).toBe('98999887766');
  });

  it('deve preservar DDD 55 sem código do país', () => {
    expect(normalizePhone('55999887766')).toBe('55999887766');
  });
});

describe('formatPhone', () => {
  it('deve aplicar a máscara do celular', () => {
    expect(formatPhone('98999887766')).toBe('(98) 99988-7766');
  });

  it('deve mascarar parcialmente durante a digitação', () => {
    expect(formatPhone('9')).toBe('9');
    expect(formatPhone('98')).toBe('98');
    expect(formatPhone('989')).toBe('(98) 9');
    expect(formatPhone('9899988')).toBe('(98) 99988');
    expect(formatPhone('98999887')).toBe('(98) 99988-7');
  });
});

describe('isValidPhone', () => {
  it('deve aceitar celular com DDD e nono dígito', () => {
    expect(isValidPhone('(98) 99988-7766')).toBe(true);
    expect(isValidPhone('+55 11 98765-4321')).toBe(true);
  });

  it('deve recusar número sem o nono dígito', () => {
    expect(isValidPhone('9832214455')).toBe(false);
  });

  it('deve recusar DDD inválido', () => {
    expect(isValidPhone('08999887766')).toBe(false);
    expect(isValidPhone('90999887766')).toBe(false);
  });

  it('deve recusar número incompleto ou vazio', () => {
    expect(isValidPhone('989998877')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});
