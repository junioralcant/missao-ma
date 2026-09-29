import {getDb} from '@/lib/db';
import {getRegistrationByWhatsapp, upsertRegistration} from '@/lib/repository';
import {POST} from '../route';

const postInstagram = (body: Record<string, unknown>) =>
  POST(
    new Request('http://localhost/api/register/instagram', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    }),
  );

const insertWithoutInstagram = (whatsapp: string, email: string) =>
  getDb()
    .prepare(
      'INSERT INTO registrations (name, whatsapp, email, city) VALUES (?, ?, ?, ?)',
    )
    .run('Maria Silva', whatsapp, email, 'São Luís');

describe('POST /api/register/instagram', () => {
  beforeEach(() => {
    getDb().exec('DELETE FROM registrations;');
  });

  it('deve adicionar o Instagram ao cadastro existente', async () => {
    insertWithoutInstagram('98999887766', 'maria@exemplo.com');

    const response = await postInstagram({
      whatsapp: '(98) 99988-7766',
      instagram: '@Maria.Silva',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ok: true});
    expect(getRegistrationByWhatsapp('98999887766')?.instagram).toBe(
      'maria.silva',
    );
  });

  it('não deve trocar o Instagram de quem já tem um cadastrado', async () => {
    upsertRegistration({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      instagram: 'maria.silva',
      city: 'São Luís',
    });

    const response = await postInstagram({
      whatsapp: '98999887766',
      instagram: 'https://www.instagram.com/maria.nova/',
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error:
        'Este WhatsApp já tem um Instagram cadastrado. Para alterar, fale com a organização.',
    });
    expect(getRegistrationByWhatsapp('98999887766')?.instagram).toBe(
      'maria.silva',
    );
  });

  it('deve recusar mesmo quando o Instagram enviado é o já cadastrado', async () => {
    upsertRegistration({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      instagram: 'maria.silva',
      city: 'São Luís',
    });

    const response = await postInstagram({
      whatsapp: '98999887766',
      instagram: 'maria.silva',
    });

    expect(response.status).toBe(409);
  });

  it('deve aceitar só a primeira de duas tentativas seguidas no mesmo WhatsApp', async () => {
    insertWithoutInstagram('98999887766', 'maria@exemplo.com');

    const first = await postInstagram({
      whatsapp: '98999887766',
      instagram: 'maria.silva',
    });
    const second = await postInstagram({
      whatsapp: '98999887766',
      instagram: 'outra.pessoa',
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(getRegistrationByWhatsapp('98999887766')?.instagram).toBe(
      'maria.silva',
    );
  });

  it('deve recusar WhatsApp sem cadastro', async () => {
    const response = await postInstagram({
      whatsapp: '98999887766',
      instagram: 'maria.silva',
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error:
        'Não encontramos cadastro com este WhatsApp. Confira o número ou faça seu cadastro.',
    });
  });

  it('deve recusar Instagram já usado por outro cadastro', async () => {
    upsertRegistration({
      name: 'Joao Pedro',
      whatsapp: '98988776655',
      email: 'joao@exemplo.com',
      instagram: 'maria.silva',
      city: 'Caxias',
    });
    insertWithoutInstagram('98999887766', 'maria@exemplo.com');

    const response = await postInstagram({
      whatsapp: '98999887766',
      instagram: '@maria.silva',
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'Este Instagram já está cadastrado.',
    });
    expect(getRegistrationByWhatsapp('98999887766')?.instagram).toBe('');
  });

  it('deve recusar WhatsApp inválido', async () => {
    const response = await postInstagram({
      whatsapp: '(98) 3221-4455',
      instagram: 'maria.silva',
    });

    expect(response.status).toBe(400);
  });

  it('deve recusar Instagram inválido ou vazio', async () => {
    insertWithoutInstagram('98999887766', 'maria@exemplo.com');

    expect((await postInstagram({whatsapp: '98999887766'})).status).toBe(400);
    expect(
      (await postInstagram({whatsapp: '98999887766', instagram: 'maria..x'}))
        .status,
    ).toBe(400);
    expect(getRegistrationByWhatsapp('98999887766')?.instagram).toBe('');
  });

  it('deve recusar body malformado sem quebrar', async () => {
    const response = await POST(
      new Request('http://localhost/api/register/instagram', {
        method: 'POST',
        body: 'não é json',
      }),
    );

    expect(response.status).toBe(400);
  });
});
