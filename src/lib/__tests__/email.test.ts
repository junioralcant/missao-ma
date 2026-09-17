import {isValidEmail, normalizeEmail} from '../email';

describe('normalizeEmail', () => {
  it('deve remover espaços e padronizar em minúsculas', () => {
    expect(normalizeEmail('  Maria.Silva@Exemplo.COM  ')).toBe(
      'maria.silva@exemplo.com',
    );
  });
});

describe('isValidEmail', () => {
  it('deve aceitar endereços válidos', () => {
    expect(isValidEmail('maria.silva@exemplo.com')).toBe(true);
    expect(isValidEmail('maria+grupos@exemplo.com.br')).toBe(true);
  });

  it('deve recusar endereços sem domínio completo', () => {
    expect(isValidEmail('maria@exemplo')).toBe(false);
    expect(isValidEmail('maria@.com')).toBe(false);
  });

  it('deve recusar endereços sem arroba ou com espaços', () => {
    expect(isValidEmail('maria.exemplo.com')).toBe(false);
    expect(isValidEmail('maria silva@exemplo.com')).toBe(false);
  });

  it('deve recusar valor vazio', () => {
    expect(isValidEmail('   ')).toBe(false);
  });
});
