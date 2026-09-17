import {
  MAX_EMAIL_LENGTH,
  MAX_EMAIL_LOCAL_LENGTH,
  isValidEmail,
  normalizeEmail,
  sanitizeEmail,
} from '../email';

describe('sanitizeEmail', () => {
  it('deve remover espaços digitados ou colados em qualquer posição', () => {
    expect(sanitizeEmail(' maria silva @exemplo.com ')).toBe(
      'mariasilva@exemplo.com',
    );
  });

  it('deve remover tabulação e quebra de linha vindas de colagem', () => {
    expect(sanitizeEmail('maria\t@exemplo\n.com')).toBe('maria@exemplo.com');
  });

  it('deve limitar ao tamanho máximo de um endereço', () => {
    expect(sanitizeEmail('a'.repeat(300))).toHaveLength(MAX_EMAIL_LENGTH);
  });
});

describe('normalizeEmail', () => {
  it('deve remover espaços das pontas e padronizar em minúsculas', () => {
    expect(normalizeEmail('  Maria.Silva@Exemplo.COM  ')).toBe(
      'maria.silva@exemplo.com',
    );
  });
});

describe('isValidEmail', () => {
  it('deve aceitar endereços comuns', () => {
    expect(isValidEmail('maria.silva@exemplo.com')).toBe(true);
    expect(isValidEmail('maria+grupos@exemplo.com.br')).toBe(true);
    expect(isValidEmail('maria_silva99@exemplo-oficial.com')).toBe(true);
    expect(isValidEmail('MARIA@EXEMPLO.COM')).toBe(true);
  });

  it('deve recusar qualquer espaço no endereço', () => {
    expect(isValidEmail('maria silva@exemplo.com')).toBe(false);
    expect(isValidEmail('maria@exemplo .com')).toBe(false);
    expect(isValidEmail('maria@ exemplo.com')).toBe(false);
  });

  it('deve recusar endereço sem arroba ou com mais de uma', () => {
    expect(isValidEmail('maria.exemplo.com')).toBe(false);
    expect(isValidEmail('maria@exemplo@com.br')).toBe(false);
  });

  it('deve recusar domínio incompleto ou malformado', () => {
    expect(isValidEmail('maria@exemplo')).toBe(false);
    expect(isValidEmail('maria@.com')).toBe(false);
    expect(isValidEmail('maria@exemplo..com')).toBe(false);
    expect(isValidEmail('maria@-exemplo.com')).toBe(false);
    expect(isValidEmail('maria@exemplo-.com')).toBe(false);
  });

  it('deve recusar domínio de primeiro nível inválido', () => {
    expect(isValidEmail('maria@exemplo.c')).toBe(false);
    expect(isValidEmail('maria@exemplo.c0m')).toBe(false);
    expect(isValidEmail('maria@exemplo.')).toBe(false);
  });

  it('deve recusar vírgula no lugar do ponto', () => {
    expect(isValidEmail('maria@exemplo,com')).toBe(false);
  });

  it('deve recusar ponto ou traço fora de lugar antes da arroba', () => {
    expect(isValidEmail('.maria@exemplo.com')).toBe(false);
    expect(isValidEmail('maria.@exemplo.com')).toBe(false);
    expect(isValidEmail('maria..silva@exemplo.com')).toBe(false);
  });

  it('deve recusar acentos e caracteres fora do padrão', () => {
    expect(isValidEmail('joão@exemplo.com')).toBe(false);
    expect(isValidEmail('maria;silva@exemplo.com')).toBe(false);
  });

  it('deve recusar endereço acima dos limites de tamanho', () => {
    const longLocal = 'a'.repeat(MAX_EMAIL_LOCAL_LENGTH + 1);
    expect(isValidEmail(`${longLocal}@exemplo.com`)).toBe(false);

    const longDomain = 'a'.repeat(MAX_EMAIL_LENGTH);
    expect(isValidEmail(`maria@${longDomain}.com`)).toBe(false);
  });

  it('deve recusar valor vazio', () => {
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});
