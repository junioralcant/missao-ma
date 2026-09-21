import {sendEmail} from '../mailer';

const message = {
  to: 'maria@exemplo.com',
  subject: 'Confirme a sua assinatura',
  html: '<p>Assinar PEC</p>',
  text: 'Assinar PEC http://localhost:3000/pec/confirmar/abc',
};

const jsonResponse = (status: number) =>
  new Response(JSON.stringify({id: 'msg_1'}), {status});

describe('sendEmail', () => {
  const originalEnv = {...process.env};

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = {...originalEnv};
  });

  it('deve enviar o e-mail pela API do Resend com o remetente configurado', async () => {
    process.env.RESEND_API_KEY = 're_chave_de_teste';
    process.env.EMAIL_FROM = 'Missão Maranhão <pec@exemplo.com>';
    process.env.EMAIL_REPLY_TO = 'contato@exemplo.com';
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200));

    await expect(sendEmail(message)).resolves.toBe('sent');

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer re_chave_de_teste',
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      from: 'Missão Maranhão <pec@exemplo.com>',
      to: ['maria@exemplo.com'],
      reply_to: 'contato@exemplo.com',
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  });

  it('deve pular o envio quando a chave não está configurada', async () => {
    process.env.RESEND_API_KEY = '';
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    await expect(sendEmail(message)).resolves.toBe('skipped');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('deve registrar o link no console quando a chave não está configurada', async () => {
    process.env.RESEND_API_KEY = '';
    const infoSpy = jest.spyOn(console, 'info');

    await sendEmail(message);

    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('RESEND_API_KEY'),
      message.to,
      message.text,
    );
  });

  it('deve devolver falso quando o Resend responde com erro', async () => {
    process.env.RESEND_API_KEY = 're_chave_de_teste';
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(422));

    await expect(sendEmail(message)).resolves.toBe('failed');
  });

  it('deve devolver falso quando a conexão falha', async () => {
    process.env.RESEND_API_KEY = 're_chave_de_teste';
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('rede indisponível'));

    await expect(sendEmail(message)).resolves.toBe('failed');
  });
});
