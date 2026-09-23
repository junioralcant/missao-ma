import {
  buildConfirmationUrl,
  buildSignatureConfirmationEmail,
  buildSignatureReminderEmail,
} from '../signatureEmail';

const params = {
  name: 'Maria Silva',
  city: 'São Luís',
  email: 'maria@exemplo.com',
  token: 'abc123',
  proposalTitle: 'PEC nº 14, de 2026',
};

describe('signatureEmail', () => {
  const originalEnv = {...process.env};

  afterEach(() => {
    process.env = {...originalEnv};
  });

  it('deve montar o link de confirmação a partir do APP_URL', () => {
    process.env.APP_URL = 'https://missaomaranhao.org.br';

    expect(buildConfirmationUrl('abc123')).toBe(
      'https://missaomaranhao.org.br/pec/confirmar/abc123',
    );
  });

  it('deve ignorar a barra final do APP_URL', () => {
    process.env.APP_URL = 'https://missaomaranhao.org.br/';

    expect(buildConfirmationUrl('abc123')).toBe(
      'https://missaomaranhao.org.br/pec/confirmar/abc123',
    );
  });

  it('deve cair no localhost quando o APP_URL não está configurado', () => {
    delete process.env.APP_URL;

    expect(buildConfirmationUrl('abc123')).toBe(
      'http://localhost:3000/pec/confirmar/abc123',
    );
  });

  it('deve endereçar a mensagem ao e-mail informado', () => {
    expect(buildSignatureConfirmationEmail(params).to).toBe(
      'maria@exemplo.com',
    );
  });

  it('deve levar o link de confirmação no HTML e no texto', () => {
    process.env.APP_URL = 'https://missaomaranhao.org.br';
    const message = buildSignatureConfirmationEmail(params);
    const url = 'https://missaomaranhao.org.br/pec/confirmar/abc123';

    expect(message.html).toContain(`href="${url}"`);
    expect(message.text).toContain(url);
  });

  it('deve trazer o botão Assinar PEC e os dados da assinatura', () => {
    const message = buildSignatureConfirmationEmail(params);

    expect(message.html).toContain('Assinar PEC');
    expect(message.html).toContain('Maria Silva');
    expect(message.html).toContain('São Luís');
    expect(message.html).toContain('PEC nº 14, de 2026');
  });
});

describe('buildSignatureReminderEmail', () => {
  const originalEnv = {...process.env};

  afterEach(() => {
    process.env = {...originalEnv};
  });

  it('deve avisar no assunto que é um lembrete', () => {
    expect(buildSignatureReminderEmail(params).subject).toBe(
      'Lembrete: falta confirmar a sua assinatura da PEC',
    );
  });

  it('deve levar o link novo no HTML e no texto', () => {
    process.env.APP_URL = 'https://missaomaranhao.org.br';
    const message = buildSignatureReminderEmail(params);
    const url = 'https://missaomaranhao.org.br/pec/confirmar/abc123';

    expect(message.html).toContain(`href="${url}"`);
    expect(message.text).toContain(url);
  });

  it('deve dizer que a assinatura ainda não foi confirmada e que o link substitui o anterior', () => {
    const message = buildSignatureReminderEmail(params);

    expect(message.text).toContain('ainda não foi confirmada');
    expect(message.text).toContain('substitui o enviado anteriormente');
    expect(message.html).toContain('Assinar PEC');
    expect(message.html).toContain('São Luís');
  });
});
