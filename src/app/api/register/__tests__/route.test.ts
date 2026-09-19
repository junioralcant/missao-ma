import {getDb} from '@/lib/db';
import {
  createGroup,
  listRegistrations,
  setDefaultGroupLink,
} from '@/lib/repository';
import {POST} from '../route';

const postRegister = (body: Record<string, unknown>) =>
  POST(
    new Request('http://localhost/api/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    }),
  );

describe('POST /api/register', () => {
  beforeEach(() => {
    getDb().exec(
      'DELETE FROM registrations; DELETE FROM groups; DELETE FROM settings;',
    );
    createGroup('São Luís', 'https://chat.whatsapp.com/AbC123');
  });

  it('deve cadastrar e devolver o link do grupo da cidade', async () => {
    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '(98) 99988-7766',
      email: 'Maria.Silva@Exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      whatsappLink: 'https://chat.whatsapp.com/AbC123',
    });

    const registrations = listRegistrations();
    expect(registrations).toHaveLength(1);
    expect(registrations[0].whatsapp).toBe('98999887766');
    expect(registrations[0].email).toBe('maria.silva@exemplo.com');
  });

  it('deve usar o grupo padrão quando a cidade não tem grupo próprio', async () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');

    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'Caxias',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      whatsappLink: 'https://chat.whatsapp.com/Padrao1',
    });

    const registrations = listRegistrations();
    expect(registrations).toHaveLength(1);
    expect(registrations[0].city).toBe('Caxias');
  });

  it('deve priorizar o grupo da cidade sobre o grupo padrão', async () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');

    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      whatsappLink: 'https://chat.whatsapp.com/AbC123',
    });
  });

  it('não deve duplicar cadastro do mesmo WhatsApp na mesma cidade', async () => {
    await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });
    const response = await postRegister({
      name: 'Maria S. Santos',
      whatsapp: '(98) 99988-7766',
      email: 'maria.santos@exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    const registrations = listRegistrations();
    expect(registrations).toHaveLength(1);
    expect(registrations[0].name).toBe('Maria S. Santos');
    expect(registrations[0].email).toBe('maria.santos@exemplo.com');
  });

  it('deve recusar WhatsApp já cadastrado em outra cidade', async () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');
    await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '+55 (98) 99988-7766',
      email: 'maria@exemplo.com',
      city: 'Caxias',
    });

    expect(response.status).toBe(409);
    const registrations = listRegistrations();
    expect(registrations).toHaveLength(1);
    expect(registrations[0].city).toBe('São Luís');
  });

  it('deve devolver o link novamente para WhatsApp já cadastrado na mesma cidade', async () => {
    await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      whatsappLink: 'https://chat.whatsapp.com/AbC123',
    });
    expect(listRegistrations()).toHaveLength(1);
  });

  it('deve recusar e-mail já cadastrado por outro WhatsApp', async () => {
    await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    const response = await postRegister({
      name: 'Joao Pedro',
      whatsapp: '98988776655',
      email: 'Maria@Exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'Este e-mail já está cadastrado.',
    });
    const registrations = listRegistrations();
    expect(registrations).toHaveLength(1);
    expect(registrations[0].name).toBe('Maria Silva');
  });

  it('deve recusar e-mail já cadastrado mesmo em outra cidade', async () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');
    await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    const response = await postRegister({
      name: 'Joao Pedro',
      whatsapp: '98988776655',
      email: 'maria@exemplo.com',
      city: 'Caxias',
    });

    expect(response.status).toBe(409);
    expect(listRegistrations()).toHaveLength(1);
  });

  it('deve deixar a pessoa trocar o e-mail do próprio cadastro', async () => {
    await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria.nova@exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    const registrations = listRegistrations();
    expect(registrations).toHaveLength(1);
    expect(registrations[0].email).toBe('maria.nova@exemplo.com');
  });

  it('deve liberar o e-mail antigo depois que a pessoa troca o dela', async () => {
    await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });
    await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria.nova@exemplo.com',
      city: 'São Luís',
    });

    const response = await postRegister({
      name: 'Joao Pedro',
      whatsapp: '98988776655',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    expect(listRegistrations()).toHaveLength(2);
  });

  it('deve recusar nome muito curto', async () => {
    const response = await postRegister({
      name: 'Ma',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(400);
    expect(listRegistrations()).toHaveLength(0);
  });

  it('deve recusar WhatsApp inválido', async () => {
    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '(98) 3221-4455',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(400);
    expect(listRegistrations()).toHaveLength(0);
  });

  it('deve recusar e-mail inválido', async () => {
    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo',
      city: 'São Luís',
    });

    expect(response.status).toBe(400);
    expect(listRegistrations()).toHaveLength(0);
  });

  it('deve recusar e-mail com espaço no meio', async () => {
    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria silva@exemplo.com',
      city: 'São Luís',
    });

    expect(response.status).toBe(400);
    expect(listRegistrations()).toHaveLength(0);
  });

  it('deve recusar cidade que não é município do Maranhão mesmo com grupo padrão', async () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');

    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'Gotham',
    });

    expect(response.status).toBe(400);
    expect(listRegistrations()).toHaveLength(0);
  });

  it('deve recusar cidade sem grupo quando não há grupo padrão', async () => {
    const response = await postRegister({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'Caxias',
    });

    expect(response.status).toBe(404);
    expect(listRegistrations()).toHaveLength(0);
  });

  it('deve recusar body malformado sem quebrar', async () => {
    const response = await POST(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: 'não é json',
      }),
    );

    expect(response.status).toBe(400);
  });
});
