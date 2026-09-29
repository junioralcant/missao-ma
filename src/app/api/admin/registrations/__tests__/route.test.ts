import {getDb} from '@/lib/db';
import {upsertRegistration} from '@/lib/repository';
import {createSessionToken} from '@/lib/session';
import {GET} from '../route';

const mockSessionCookie = {value: ''};

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) =>
      name === 'admin_session' && mockSessionCookie.value
        ? mockSessionCookie
        : undefined,
  }),
}));

const getRegistrations = (query = '') =>
  GET(new Request(`http://localhost/api/admin/registrations${query}`));

describe('GET /api/admin/registrations', () => {
  const originalAdminPassword = process.env.ADMIN_PASSWORD;

  beforeAll(() => {
    process.env.ADMIN_PASSWORD = 'senha-de-teste';
  });

  afterAll(() => {
    process.env.ADMIN_PASSWORD = originalAdminPassword;
  });

  beforeEach(() => {
    mockSessionCookie.value = createSessionToken();
    getDb().exec('DELETE FROM registrations;');
    upsertRegistration({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      instagram: 'maria.silva',
      city: 'São Luís',
    });
    getDb()
      .prepare(
        'INSERT INTO registrations (name, whatsapp, email, city) VALUES (?, ?, ?, ?)',
      )
      .run('Joao Pedro', '98988776655', 'joao@exemplo.com', 'Caxias');
  });

  it('deve recusar quem não está logado', async () => {
    mockSessionCookie.value = '';

    const response = await getRegistrations('?format=csv');

    expect(response.status).toBe(401);
  });

  it('deve devolver o Instagram na listagem em JSON', async () => {
    const response = await getRegistrations();
    const {registrations} = await response.json();

    expect(
      registrations.map((registration: {name: string; instagram: string}) => [
        registration.name,
        registration.instagram,
      ]),
    ).toEqual(
      expect.arrayContaining([
        ['Maria Silva', 'maria.silva'],
        ['Joao Pedro', ''],
      ]),
    );
  });

  it('deve exportar a coluna Instagram no CSV com @', async () => {
    const response = await getRegistrations('?format=csv');
    const lines = (await response.text()).replace('﻿', '').split('\n');

    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(lines[0]).toBe('Nome;WhatsApp;E-mail;Instagram;Cidade;Data (UTC)');
    expect(lines.find(line => line.startsWith('Maria Silva'))).toMatch(
      /^Maria Silva;\(98\) 99988-7766;maria@exemplo\.com;@maria\.silva;São Luís;/,
    );
  });

  it('deve deixar o Instagram vazio no CSV para cadastro antigo', async () => {
    const response = await getRegistrations('?format=csv');
    const lines = (await response.text()).split('\n');

    expect(lines.find(line => line.startsWith('Joao Pedro'))).toMatch(
      /^Joao Pedro;\(98\) 98877-6655;joao@exemplo\.com;;Caxias;/,
    );
  });
});
