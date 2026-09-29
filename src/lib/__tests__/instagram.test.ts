import {
  MAX_INSTAGRAM_INPUT_LENGTH,
  buildInstagramProfileLink,
  formatInstagram,
  isValidInstagram,
  normalizeInstagram,
  sanitizeInstagram,
} from '../instagram';

describe('sanitizeInstagram', () => {
  it('deve remover espaços digitados', () => {
    expect(sanitizeInstagram(' maria .silva ')).toBe('maria.silva');
  });

  it('deve trocar o link colado do perfil pelo usuário', () => {
    expect(
      sanitizeInstagram(
        'https://www.instagram.com/Maria.Silva/?igsh=MWQ1ZGUxMzBkMGo3Zg==',
      ),
    ).toBe('Maria.Silva');
    expect(sanitizeInstagram('Instagram.com/maria_silva')).toBe('maria_silva');
  });

  it('deve manter o usuário digitado com @', () => {
    expect(sanitizeInstagram('@Maria.Silva')).toBe('@Maria.Silva');
  });
});

describe('normalizeInstagram', () => {
  it('deve remover o @ do começo e deixar em minúsculas', () => {
    expect(normalizeInstagram('@Maria.Silva')).toBe('maria.silva');
  });

  it('deve extrair o usuário de um link do perfil com letras maiúsculas', () => {
    expect(normalizeInstagram('HTTPS://WWW.INSTAGRAM.COM/Maria.Silva')).toBe(
      'maria.silva',
    );
  });

  it('deve extrair o usuário de um link do perfil', () => {
    expect(
      normalizeInstagram('https://www.instagram.com/maria_silva/?hl=pt-br'),
    ).toBe('maria_silva');
    expect(normalizeInstagram('instagram.com/maria_silva')).toBe('maria_silva');
  });
});

describe('isValidInstagram', () => {
  it('deve aceitar usuários com letras, números, ponto e sublinhado', () => {
    expect(isValidInstagram('maria.silva_98')).toBe(true);
    expect(isValidInstagram('@maria')).toBe(true);
  });

  it('deve recusar usuário vazio', () => {
    expect(isValidInstagram('')).toBe(false);
    expect(isValidInstagram('@')).toBe(false);
  });

  it('deve recusar caracteres fora do permitido', () => {
    expect(isValidInstagram('maria-silva')).toBe(false);
    expect(isValidInstagram('maria silva')).toBe(false);
    expect(isValidInstagram('mária')).toBe(false);
  });

  it('deve recusar ponto no começo, no fim ou repetido', () => {
    expect(isValidInstagram('.maria')).toBe(false);
    expect(isValidInstagram('maria.')).toBe(false);
    expect(isValidInstagram('maria..silva')).toBe(false);
  });

  it('deve recusar usuário com mais de 30 caracteres', () => {
    expect(isValidInstagram('a'.repeat(30))).toBe(true);
    expect(isValidInstagram('a'.repeat(31))).toBe(false);
  });
});

describe('formatInstagram', () => {
  it('deve exibir o usuário com @', () => {
    expect(formatInstagram('Maria.Silva')).toBe('@maria.silva');
  });

  it('deve deixar em branco quando não houver usuário', () => {
    expect(formatInstagram('')).toBe('');
  });
});

describe('MAX_INSTAGRAM_INPUT_LENGTH', () => {
  it('deve caber um link de perfil com parâmetros de compartilhamento', () => {
    const link =
      'https://www.instagram.com/usuario.com.trinta.caracteres/?igsh=MWQ1ZGUxMzBkMGo3Zg%3D%3D&utm_source=qr';
    expect(link.length).toBeLessThanOrEqual(MAX_INSTAGRAM_INPUT_LENGTH);
  });
});

describe('buildInstagramProfileLink', () => {
  it('deve montar o link do perfil', () => {
    expect(buildInstagramProfileLink('@maria.silva')).toBe(
      'https://www.instagram.com/maria.silva/',
    );
  });
});
