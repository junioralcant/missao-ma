import {db} from '@/lib/db';
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
    db.exec(
      'DELETE FROM registrations; DELETE FROM groups; DELETE FROM settings;',
    );
    createGroup('São Luís', 'https://chat.whatsapp.com/AbC123');
  });

  it('deve cadastrar e devolver o link do grupo da cidade', async () => {
    const response = await postRegister({
      name: 'Maria Silva',
      cpf: '529.982.247-25',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      whatsappLink: 'https://chat.whatsapp.com/AbC123',
    });

    const registrations = listRegistrations();
    expect(registrations).toHaveLength(1);
    expect(registrations[0].cpf).toBe('52998224725');
  });

  it('deve usar o grupo padrão quando a cidade não tem grupo próprio', async () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');

    const response = await postRegister({
      name: 'Maria Silva',
      cpf: '52998224725',
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
      cpf: '52998224725',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      whatsappLink: 'https://chat.whatsapp.com/AbC123',
    });
  });

  it('não deve duplicar cadastro do mesmo CPF na mesma cidade', async () => {
    await postRegister({
      name: 'Maria Silva',
      cpf: '52998224725',
      city: 'São Luís',
    });
    const response = await postRegister({
      name: 'Maria S. Santos',
      cpf: '529.982.247-25',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    expect(listRegistrations()).toHaveLength(1);
  });

  it('deve recusar CPF já cadastrado em outra cidade', async () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');
    await postRegister({
      name: 'Maria Silva',
      cpf: '52998224725',
      city: 'São Luís',
    });

    const response = await postRegister({
      name: 'Maria Silva',
      cpf: '529.982.247-25',
      city: 'Caxias',
    });

    expect(response.status).toBe(409);
    const registrations = listRegistrations();
    expect(registrations).toHaveLength(1);
    expect(registrations[0].city).toBe('São Luís');
  });

  it('deve devolver o link novamente para CPF já cadastrado na mesma cidade', async () => {
    await postRegister({
      name: 'Maria Silva',
      cpf: '52998224725',
      city: 'São Luís',
    });

    const response = await postRegister({
      name: 'Maria Silva',
      cpf: '52998224725',
      city: 'São Luís',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      whatsappLink: 'https://chat.whatsapp.com/AbC123',
    });
    expect(listRegistrations()).toHaveLength(1);
  });

  it('deve recusar nome muito curto', async () => {
    const response = await postRegister({
      name: 'Ma',
      cpf: '52998224725',
      city: 'São Luís',
    });

    expect(response.status).toBe(400);
    expect(listRegistrations()).toHaveLength(0);
  });

  it('deve recusar CPF inválido', async () => {
    const response = await postRegister({
      name: 'Maria Silva',
      cpf: '111.111.111-11',
      city: 'São Luís',
    });

    expect(response.status).toBe(400);
    expect(listRegistrations()).toHaveLength(0);
  });

  it('deve recusar cidade que não é município do Maranhão mesmo com grupo padrão', async () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');

    const response = await postRegister({
      name: 'Maria Silva',
      cpf: '52998224725',
      city: 'Gotham',
    });

    expect(response.status).toBe(400);
    expect(listRegistrations()).toHaveLength(0);
  });

  it('deve recusar cidade sem grupo quando não há grupo padrão', async () => {
    const response = await postRegister({
      name: 'Maria Silva',
      cpf: '52998224725',
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
