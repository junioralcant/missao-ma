import {SIGNATURE_CONSENT_TEXT, SIGNATURE_READING_TEXT} from '@/lib/consent';
import {getProposalDocument} from '@/lib/document';
import {getDb} from '@/lib/db';
import {verifySignatureChain} from '@/lib/integrity';
import {getProposal} from '@/lib/proposal';
import {
  countSignaturesByCity,
  getSignatureByCpf,
  listProposalVersions,
  listSignatureEntries,
  listSignatures,
} from '@/lib/repository';
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
  city: 'São Luís',
  consent: true,
  hasReadDocument: true,
};

describe('POST /api/pec/sign', () => {
  beforeEach(() => {
    getDb().exec(
      'DELETE FROM signatures; DELETE FROM proposal_versions; DELETE FROM settings;',
    );
  });

  it('deve registrar a assinatura e devolver o protocolo', async () => {
    const response = await postSign(validSignature);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.alreadySigned).toBe(false);
    expect(data.city).toBe('São Luís');
    expect(data.receipt).toMatch(/^PEC-[0-9A-F]{10}$/);

    const signatures = listSignatures();
    expect(signatures).toHaveLength(1);
    expect(signatures[0].cpf).toBe('52998224725');
    expect(signatures[0].receipt).toBe(data.receipt);
  });

  it('deve guardar o IP de forma irreversível', async () => {
    await postSign(validSignature, {'x-forwarded-for': '200.150.100.50'});

    const row = getDb()
      .prepare('SELECT ip_hash FROM signatures WHERE cpf = ?')
      .get('52998224725') as unknown as {ip_hash: string};

    expect(row.ip_hash).toHaveLength(64);
    expect(row.ip_hash).not.toContain('200.150.100.50');
  });

  it('não deve duplicar a assinatura do mesmo CPF', async () => {
    const first = await postSign(validSignature);
    const second = await postSign({...validSignature, name: 'Maria S. Silva'});

    expect(second.status).toBe(200);
    const data = await second.json();
    expect(data.alreadySigned).toBe(true);
    expect(data.receipt).toBe((await first.json()).receipt);
    expect(listSignatures()).toHaveLength(1);
  });

  it('deve manter o município da primeira assinatura quando o CPF repete em outra cidade', async () => {
    await postSign(validSignature);
    const response = await postSign({...validSignature, city: 'Caxias'});

    const data = await response.json();
    expect(data.city).toBe('São Luís');
    expect(getSignatureByCpf('52998224725')?.city).toBe('São Luís');
  });

  it('deve contar as assinaturas por município', async () => {
    await postSign(validSignature);
    await postSign({...validSignature, cpf: '111.444.777-35', city: 'Caxias'});

    expect(countSignaturesByCity()).toEqual({'São Luís': 1, Caxias: 1});
  });

  it('deve recusar assinatura sem confirmação de leitura da proposta', async () => {
    const response = await postSign({
      ...validSignature,
      hasReadDocument: false,
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'É necessário confirmar a leitura da íntegra da proposta.',
    });
    expect(listSignatures()).toHaveLength(0);
  });

  it('deve registrar o arquivo lido e a declaração de leitura', async () => {
    await postSign(validSignature);

    const [entry] = listSignatureEntries();
    expect(entry.documentHash).toBe(getProposalDocument().hash);
    expect(entry.readingText).toBe(SIGNATURE_READING_TEXT);
  });

  it('deve recusar assinatura sem consentimento', async () => {
    const response = await postSign({...validSignature, consent: false});

    expect(response.status).toBe(400);
    expect(listSignatures()).toHaveLength(0);
  });

  it('deve recusar CPF inválido', async () => {
    const response = await postSign({
      ...validSignature,
      cpf: '111.111.111-11',
    });

    expect(response.status).toBe(400);
    expect(listSignatures()).toHaveLength(0);
  });

  it('deve recusar nome muito curto', async () => {
    const response = await postSign({...validSignature, name: 'Ma'});

    expect(response.status).toBe(400);
    expect(listSignatures()).toHaveLength(0);
  });

  it('deve recusar município fora do Maranhão', async () => {
    const response = await postSign({...validSignature, city: 'Gotham'});

    expect(response.status).toBe(400);
    expect(listSignatures()).toHaveLength(0);
  });

  it('deve vincular a assinatura ao texto da minuta e ao consentimento', async () => {
    const response = await postSign(validSignature);
    const data = await response.json();

    expect(data.proposalHash).toBe(getProposal().hash);

    const [entry] = listSignatureEntries();
    expect(entry.proposalHash).toBe(getProposal().hash);
    expect(entry.consentText).toBe(SIGNATURE_CONSENT_TEXT);
  });

  it('deve registrar a versão da minuta assinada', async () => {
    await postSign(validSignature);

    const versions = listProposalVersions();
    expect(versions).toHaveLength(1);
    expect(versions[0].hash).toBe(getProposal().hash);
    expect(versions[0].title).toBe(getProposal().title);
  });

  it('deve encadear as assinaturas em uma cadeia verificável', async () => {
    await postSign(validSignature);
    await postSign({...validSignature, cpf: '111.444.777-35', city: 'Caxias'});

    const entries = listSignatureEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].prevHash).toBe('');
    expect(entries[1].prevHash).toBe(entries[0].entryHash);
    expect(verifySignatureChain(entries).isValid).toBe(true);
  });

  it('deve quebrar a verificação quando um registro é adulterado no banco', async () => {
    await postSign(validSignature);
    await postSign({...validSignature, cpf: '111.444.777-35', city: 'Caxias'});

    const [first] = listSignatureEntries();
    getDb()
      .prepare("UPDATE signatures SET city = 'Imperatriz' WHERE id = ?")
      .run(first.id);

    const result = verifySignatureChain(listSignatureEntries());
    expect(result.isValid).toBe(false);
    expect(result.brokenAtId).toBe(first.id);
  });

  it('deve recusar body malformado sem quebrar', async () => {
    const response = await POST(
      new Request('http://localhost/api/pec/sign', {
        method: 'POST',
        body: 'não é json',
      }),
    );

    expect(response.status).toBe(400);
  });
});
