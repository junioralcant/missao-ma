import {getDb} from '@/lib/db';
import {getSignatureRequestByEmail} from '@/lib/repository';
import {createSessionToken} from '@/lib/session';
import {POST as confirmPost} from '../../../../../../pec/confirm/route';
import {POST as signPost} from '../../../../../../pec/sign/route';
import {POST} from '../route';

const mockSessionCookie = {value: ''};

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) =>
      name === 'admin_session' && mockSessionCookie.value
        ? mockSessionCookie
        : undefined,
  }),
}));

const validSignature = {
  name: 'Maria Silva',
  cpf: '529.982.247-25',
  email: 'maria@exemplo.com',
  city: 'São Luís',
  consent: true,
  hasReadDocument: true,
};

const jsonRequest = (url: string, body: Record<string, unknown> = {}) =>
  new Request(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });

const lastSentMessage = () => {
  const calls = (globalThis.fetch as jest.Mock).mock.calls;
  return JSON.parse(String(calls[calls.length - 1][1].body));
};

const extractToken = (text: string): string =>
  String(text.match(/\/pec\/confirmar\/([0-9a-f]+)/)?.[1]);

const requestSignature = async (): Promise<{id: number; token: string}> => {
  await signPost(jsonRequest('http://localhost/api/pec/sign', validSignature));
  return {
    id: Number(getSignatureRequestByEmail('maria@exemplo.com')?.id),
    token: extractToken(lastSentMessage().text),
  };
};

const postResend = (id: number | string) =>
  POST(
    new Request(`http://localhost/api/admin/pec/requests/${id}/resend`, {
      method: 'POST',
    }),
    {params: {id: String(id)}},
  );

const postConfirm = (token: string) =>
  confirmPost(jsonRequest('http://localhost/api/pec/confirm', {token}));

const expireRequests = () => {
  getDb()
    .prepare('UPDATE signature_requests SET expires_at = ?')
    .run('2020-01-01 00:00:00');
};

describe('POST /api/admin/pec/requests/[id]/resend', () => {
  const originalEnv = {...process.env};

  beforeEach(() => {
    getDb().exec(
      'DELETE FROM signatures; DELETE FROM signature_requests; DELETE FROM proposal_versions; DELETE FROM settings;',
    );
    jest.restoreAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.RESEND_API_KEY = 're_chave_de_teste';
    process.env.SESSION_SECRET = 'segredo-de-teste';
    mockSessionCookie.value = createSessionToken();
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', {status: 200}));
  });

  afterEach(() => {
    process.env = {...originalEnv};
  });

  it('deve recusar quem não está logado como admin', async () => {
    const {id} = await requestSignature();
    mockSessionCookie.value = '';

    const response = await postResend(id);

    expect(response.status).toBe(401);
  });

  it('deve reenviar o lembrete para o e-mail do pedido', async () => {
    const {id} = await requestSignature();

    const response = await postResend(id);

    expect(response.status).toBe(200);
    const message = lastSentMessage();
    expect(message.to).toEqual(['maria@exemplo.com']);
    expect(message.subject).toBe(
      'Lembrete: falta confirmar a sua assinatura da PEC',
    );
  });

  it('deve gerar um link novo e invalidar o anterior', async () => {
    const {id, token: oldToken} = await requestSignature();
    await postResend(id);
    const newToken = extractToken(lastSentMessage().text);

    expect(newToken).not.toBe(oldToken);
    expect((await postConfirm(oldToken)).status).toBe(404);
    expect((await postConfirm(newToken)).status).toBe(200);
  });

  it('deve renovar o prazo de um pedido expirado', async () => {
    const {id} = await requestSignature();
    expireRequests();

    const data = await (await postResend(id)).json();

    expect(data.expiresAt).not.toBe('2020-01-01 00:00:00');
    expect(
      (await postConfirm(extractToken(lastSentMessage().text))).status,
    ).toBe(200);
  });

  it('deve manter o link anterior quando o envio falha', async () => {
    const {id, token} = await requestSignature();
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      new Response('erro', {status: 500}),
    );

    const response = await postResend(id);

    expect(response.status).toBe(502);
    expect((await postConfirm(token)).status).toBe(200);
  });

  it('deve recusar pedido já confirmado', async () => {
    const {id, token} = await requestSignature();
    await postConfirm(token);

    const response = await postResend(id);

    expect(response.status).toBe(409);
  });

  it('deve recusar pedido inexistente', async () => {
    const response = await postResend(999);

    expect(response.status).toBe(404);
  });
});
