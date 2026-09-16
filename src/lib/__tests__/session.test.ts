import {
  ADMIN_HOME,
  createSessionToken,
  isValidSessionToken,
  sanitizeAdminRedirect,
} from '../session';

const ORIGINAL_ENV = {...process.env};

describe('sessão administrativa', () => {
  beforeEach(() => {
    process.env = {...ORIGINAL_ENV, SESSION_SECRET: 'segredo-de-teste'};
  });

  afterAll(() => {
    process.env = {...ORIGINAL_ENV};
  });

  it('deve validar token criado com o mesmo segredo', () => {
    expect(isValidSessionToken(createSessionToken())).toBe(true);
  });

  it('deve rejeitar token adulterado', () => {
    const token = createSessionToken();
    expect(isValidSessionToken(`${token.slice(0, -1)}0`)).toBe(false);
    expect(isValidSessionToken('admin.assinatura-falsa')).toBe(false);
  });

  it('deve rejeitar token ausente', () => {
    expect(isValidSessionToken(undefined)).toBe(false);
    expect(isValidSessionToken('')).toBe(false);
  });

  it('deve invalidar token quando o segredo muda', () => {
    const token = createSessionToken();
    process.env.SESSION_SECRET = 'outro-segredo';
    expect(isValidSessionToken(token)).toBe(false);
  });

  it('deve usar ADMIN_PASSWORD como fallback de segredo', () => {
    delete process.env.SESSION_SECRET;
    process.env.ADMIN_PASSWORD = 'senha-admin';
    expect(isValidSessionToken(createSessionToken())).toBe(true);
  });

  it('deve rejeitar qualquer token quando não há segredo configurado', () => {
    const token = createSessionToken();
    delete process.env.SESSION_SECRET;
    delete process.env.ADMIN_PASSWORD;
    expect(isValidSessionToken(token)).toBe(false);
  });
});

describe('sanitizeAdminRedirect', () => {
  it('deve preservar rotas do admin', () => {
    expect(sanitizeAdminRedirect('/admin/pec')).toBe('/admin/pec');
    expect(sanitizeAdminRedirect('/admin')).toBe('/admin');
  });

  it('deve cair no painel padrão quando não há destino', () => {
    expect(sanitizeAdminRedirect(undefined)).toBe(ADMIN_HOME);
    expect(sanitizeAdminRedirect('')).toBe(ADMIN_HOME);
  });

  it('deve recusar redirecionamento para fora do site', () => {
    expect(sanitizeAdminRedirect('https://evil.com')).toBe(ADMIN_HOME);
    expect(sanitizeAdminRedirect('//evil.com')).toBe(ADMIN_HOME);
    expect(sanitizeAdminRedirect('http://admin.evil.com')).toBe(ADMIN_HOME);
  });

  it('deve recusar rotas fora do admin', () => {
    expect(sanitizeAdminRedirect('/pec')).toBe(ADMIN_HOME);
    expect(sanitizeAdminRedirect('/')).toBe(ADMIN_HOME);
    expect(sanitizeAdminRedirect('/administrativo')).toBe(ADMIN_HOME);
  });

  it('deve recusar travessia de caminho e javascript:', () => {
    expect(sanitizeAdminRedirect('/admin/../../etc')).toBe(ADMIN_HOME);
    expect(sanitizeAdminRedirect('javascript:alert(1)')).toBe(ADMIN_HOME);
  });
});
