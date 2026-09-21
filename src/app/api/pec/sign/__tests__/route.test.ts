import {SIGNATURE_CONSENT_TEXT, SIGNATURE_READING_TEXT} from '@/lib/consent';
import {getDb} from '@/lib/db';
import {getProposal} from '@/lib/proposal';
import {
  appendSignature,
  countSignaturesByCity,
  getSignatureRequestByEmail,
  listProposalVersions,
  listSignatures,
} from '@/lib/repository';
import {buildEntryHash, nowUtc} from '@/lib/signature';
import {POST} from '../route';

const postSign = (body: Record<string, unknown>, headers?: HeadersInit) =>
  POST(
    new Request('http://localhost/api/pec/sign', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...headers},
      body: JSON.stringify(body),
    }),
  );

const validSignature = {
  name: 'Maria Silva',
  cpf: '529.982.247-25',
  email: 'maria@exemplo.com',
  city: 'São Luís',
  consent: true,
  hasReadDocument: true,
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

const readSentEmail = () => {
  const call = (globalThis.fetch as jest.Mock).mock.calls[0];
  return JSON.parse(String(call[1].body));
};

describe('POST /api/pec/sign', () => {
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

  it('deve guardar o pedido como pendente sem registrar a assinatura', async () => {
    const response = await postSign(validSignature);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      email: 'maria@exemplo.com',
      alreadySigned: false,
      resent: true,
    });
    expect(listSignatures()).toHaveLength(0);
    expect(getSignatureRequestByEmail('maria@exemplo.com')).toMatchObject({
      name: 'Maria Silva',
      cpf: '52998224725',
      city: 'São Luís',
      status: 'pending',
    });
  });

  it('não deve contar pedido pendente no progresso da coleta', async () => {
    await postSign(validSignature);

    expect(countSignaturesByCity()).toEqual({});
  });

  it('deve enviar o e-mail de confirmação com o link da tela de assinatura', async () => {
    await postSign(validSignature);

    const message = readSentEmail();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(message.to).toEqual(['maria@exemplo.com']);
    expect(message.html).toContain('Assinar PEC');
    expect(message.text).toMatch(/\/pec\/confirmar\/[0-9a-f]{64}/);
  });

  it('deve guardar o IP do pedido de forma irreversível', async () => {
    await postSign(validSignature, {'x-forwarded-for': '200.150.100.50'});

    const row = getDb()
      .prepare('SELECT ip_hash FROM signature_requests WHERE cpf = ?')
      .get('52998224725') as unknown as {ip_hash: string};

    expect(row.ip_hash).toHaveLength(64);
    expect(row.ip_hash).not.toContain('200.150.100.50');
  });

  it('deve sobrescrever o pedido pendente quando o mesmo e-mail se cadastra de novo', async () => {
    await postSign(validSignature);
    const response = await postSign({...validSignature, city: 'Imperatriz'});

    expect(response.status).toBe(200);
    expect(getSignatureRequestByEmail('maria@exemplo.com')).toMatchObject({
      city: 'Imperatriz',
      status: 'pending',
    });
    const total = getDb()
      .prepare('SELECT COUNT(*) AS total FROM signature_requests')
      .get() as unknown as {total: number};
    expect(Number(total.total)).toBe(1);
  });

  it('deve invalidar o link anterior ao sobrescrever o pedido pendente', async () => {
    await postSign(validSignature);
    const firstEmail = readSentEmail();
    await postSign({...validSignature, city: 'Imperatriz'});
    const secondEmail = JSON.parse(
      String((globalThis.fetch as jest.Mock).mock.calls[1][1].body),
    );

    expect(secondEmail.text).not.toBe(firstEmail.text);
  });

  it('não deve reenviar o e-mail quando o mesmo cadastro é repetido em seguida', async () => {
    await postSign(validSignature);
    const response = await postSign(validSignature);

    expect(await response.json()).toMatchObject({resent: false});
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('não deve permitir e-mail já usado em assinatura confirmada', async () => {
    seedSignature('11144477735', 'maria@exemplo.com');

    const response = await postSign(validSignature);

    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe(
      'Este e-mail já foi usado para assinar a proposta.',
    );
    expect(getSignatureRequestByEmail('maria@exemplo.com')).toBeNull();
  });

  it('deve devolver o protocolo quando o CPF já assinou', async () => {
    seedSignature('52998224725', 'outro@exemplo.com');

    const response = await postSign(validSignature);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      receipt: 'PEC-EXISTENTE',
      city: 'Caxias',
      alreadySigned: true,
    });
  });

  it('deve recusar e-mail inválido', async () => {
    const response = await postSign({...validSignature, email: 'maria@'});

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('E-mail inválido.');
  });

  it('deve recusar CPF inválido antes de enviar qualquer e-mail', async () => {
    const response = await postSign({...validSignature, cpf: '111.111.111-11'});

    expect(response.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('deve apagar o pedido pendente quando o envio do e-mail falha', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', {status: 500}));

    const response = await postSign(validSignature);

    expect(response.status).toBe(502);
    expect(getSignatureRequestByEmail('maria@exemplo.com')).toBeNull();
  });

  it('deve guardar a versão da proposta lida no pedido', async () => {
    await postSign(validSignature);

    expect(listProposalVersions()).toHaveLength(1);
    expect(getSignatureRequestByEmail('maria@exemplo.com')?.proposalHash).toBe(
      getProposal().hash,
    );
  });
});
