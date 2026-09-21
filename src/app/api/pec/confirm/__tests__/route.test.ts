import {SIGNATURE_CONSENT_TEXT, SIGNATURE_READING_TEXT} from '@/lib/consent';
import {getDb} from '@/lib/db';
import {verifySignatureChain} from '@/lib/integrity';
import {getProposal} from '@/lib/proposal';
import {
  appendSignature,
  countSignaturesByCity,
  getSignatureRequestByEmail,
  listSignatureEntries,
  listSignatures,
} from '@/lib/repository';
import {buildEntryHash, nowUtc} from '@/lib/signature';
import {POST as signPost} from '../../sign/route';
import {POST} from '../route';

const validSignature = {
  name: 'Maria Silva',
  cpf: '529.982.247-25',
  email: 'maria@exemplo.com',
  city: 'São Luís',
  consent: true,
  hasReadDocument: true,
};

const postConfirm = (body: Record<string, unknown>) =>
  POST(
    new Request('http://localhost/api/pec/confirm', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    }),
  );

const requestSignature = async (
  body: Record<string, unknown> = validSignature,
): Promise<string> => {
  await signPost(
    new Request('http://localhost/api/pec/sign', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    }),
  );
  const calls = (globalThis.fetch as jest.Mock).mock.calls;
  const message = JSON.parse(String(calls[calls.length - 1][1].body));
  return String(message.text.match(/\/pec\/confirmar\/([0-9a-f]+)/)[1]);
};

const seedSignature = (cpf: string, email: string) => {
  const createdAt = nowUtc();
  const proposal = getProposal();
  appendSignature(
    {
      name: 'Assinante Anterior',
      cpf,
      email,
      city: 'Caxias',
      receipt: 'PEC-EXISTENTE',
      ipHash: 'hash',
      userAgent: 'jest',
      proposalHash: proposal.hash,
      documentHash: proposal.documentHash,
      consentText: SIGNATURE_CONSENT_TEXT,
      readingText: SIGNATURE_READING_TEXT,
      createdAt,
    },
    prevHash =>
      buildEntryHash({
        prevHash,
        name: 'Assinante Anterior',
        cpf,
        city: 'Caxias',
        proposalHash: proposal.hash,
        documentHash: proposal.documentHash,
        consentText: SIGNATURE_CONSENT_TEXT,
        readingText: SIGNATURE_READING_TEXT,
        createdAt,
      }),
  );
};

const expireRequests = () => {
  getDb()
    .prepare('UPDATE signature_requests SET expires_at = ?')
    .run('2020-01-01 00:00:00');
};

describe('POST /api/pec/confirm', () => {
  const originalEnv = {...process.env};

  beforeEach(() => {
    getDb().exec(
      'DELETE FROM signatures; DELETE FROM signature_requests; DELETE FROM proposal_versions; DELETE FROM settings;',
    );
    jest.restoreAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.RESEND_API_KEY = 're_chave_de_teste';
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', {status: 200}));
  });

  afterEach(() => {
    process.env = {...originalEnv};
  });

  it('deve registrar a assinatura e devolver o protocolo', async () => {
    const token = await requestSignature();

    const response = await postConfirm({token});

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.alreadyConfirmed).toBe(false);
    expect(data.city).toBe('São Luís');
    expect(data.receipt).toMatch(/^PEC-[0-9A-F]{10}$/);
    const signatures = listSignatures();
    expect(signatures).toHaveLength(1);
    expect(signatures[0]).toMatchObject({
      cpf: '52998224725',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });
  });

  it('deve manter a cadeia de integridade válida após a confirmação', async () => {
    const first = await requestSignature();
    await postConfirm({token: first});
    const second = await requestSignature({
      ...validSignature,
      name: 'João Pedro',
      cpf: '111.444.777-35',
      email: 'joao@exemplo.com',
      city: 'Imperatriz',
    });
    await postConfirm({token: second});

    expect(verifySignatureChain(listSignatureEntries())).toMatchObject({
      total: 2,
      isValid: true,
      brokenAtId: null,
    });
  });

  it('deve passar a contar a assinatura no progresso da coleta', async () => {
    const token = await requestSignature();

    await postConfirm({token});

    expect(countSignaturesByCity()).toEqual({'São Luís': 1});
  });

  it('deve marcar o pedido como confirmado', async () => {
    const token = await requestSignature();

    const data = await (await postConfirm({token})).json();

    expect(getSignatureRequestByEmail('maria@exemplo.com')).toMatchObject({
      status: 'confirmed',
      receipt: data.receipt,
    });
  });

  it('deve devolver o mesmo protocolo quando o link é aberto duas vezes', async () => {
    const token = await requestSignature();
    const first = await (await postConfirm({token})).json();

    const response = await postConfirm({token});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      receipt: first.receipt,
      city: 'São Luís',
      alreadyConfirmed: true,
    });
    expect(listSignatures()).toHaveLength(1);
  });

  it('deve recusar token inexistente', async () => {
    const response = await postConfirm({token: 'token-que-nao-existe'});

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe('Link de confirmação inválido.');
  });

  it('deve recusar token expirado', async () => {
    const token = await requestSignature();
    expireRequests();

    const response = await postConfirm({token});

    expect(response.status).toBe(410);
    expect((await response.json()).error).toBe(
      'Link de confirmação expirado. Assine novamente.',
    );
    expect(listSignatures()).toHaveLength(0);
  });

  it('deve recusar quando o e-mail foi confirmado por outro CPF no intervalo', async () => {
    const token = await requestSignature();
    seedSignature('111.444.777-35'.replace(/\D/g, ''), 'maria@exemplo.com');

    const response = await postConfirm({token});

    expect(response.status).toBe(409);
    expect(listSignatures()).toHaveLength(1);
  });

  it('deve devolver o protocolo existente quando o CPF já assinou', async () => {
    const token = await requestSignature();
    seedSignature('52998224725', 'outro@exemplo.com');

    const response = await postConfirm({token});

    expect(await response.json()).toEqual({
      receipt: 'PEC-EXISTENTE',
      city: 'Caxias',
      alreadyConfirmed: true,
    });
    expect(listSignatures()).toHaveLength(1);
  });

  it('deve registrar a versão da proposta que a pessoa leu', async () => {
    const token = await requestSignature();

    const data = await (await postConfirm({token})).json();

    expect(data.proposalHash).toBe(getProposal().hash);
    expect(listSignatureEntries()[0].consentText).toBe(SIGNATURE_CONSENT_TEXT);
    expect(listSignatureEntries()[0].readingText).toBe(SIGNATURE_READING_TEXT);
  });
});
