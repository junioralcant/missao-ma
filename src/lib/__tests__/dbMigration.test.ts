import fs from 'fs';
import os from 'os';
import path from 'path';
import {DatabaseSync} from 'node:sqlite';
import type {Registration} from '../types';

const createLegacyDatabase = (): string => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'missao-ma-legacy-'));
  const databasePath = path.join(directory, 'app.db');
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO registrations (id, name, cpf, city, created_at) VALUES
      (1, 'Brenda Marques', '05745650354', 'Açailândia', '2026-08-24 14:33:18'),
      (2, 'Joao Pedro', '52998224725', 'Caxias', '2026-08-25 10:00:00');
  `);
  database.close();
  return databasePath;
};

const createDuplicateEmailDatabase = (): string => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'missao-ma-emails-'));
  const databasePath = path.join(directory, 'app.db');
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      whatsapp TEXT UNIQUE,
      email TEXT,
      city TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO registrations (id, name, whatsapp, email, city, created_at) VALUES
      (1, 'Brenda Marques', NULL, NULL, 'Açailândia', '2026-08-24 14:33:18'),
      (2, 'Joao Pedro', NULL, NULL, 'Caxias', '2026-08-25 10:00:00'),
      (3, 'Maria Silva', '98999887766', 'maria@exemplo.com', 'São Luís', '2026-08-26 09:00:00'),
      (4, 'Maria S. Santos', '98988776655', 'maria@exemplo.com', 'São Luís', '2026-08-27 09:00:00'),
      (5, 'Ana Souza', '98977665544', 'ana@exemplo.com', 'Imperatriz', '2026-08-28 09:00:00');
  `);
  database.close();
  return databasePath;
};

const loadRepository = (databasePath: string) => {
  process.env.DATABASE_PATH = databasePath;
  delete (globalThis as {appDatabase?: unknown}).appDatabase;
  let repository!: typeof import('../repository');
  jest.isolateModules(() => {
    repository = require('../repository');
  });
  return repository;
};

describe('migração dos cadastros com CPF', () => {
  const originalDatabasePath = process.env.DATABASE_PATH;
  let databasePath: string;
  let registrations: Registration[];

  beforeAll(() => {
    databasePath = createLegacyDatabase();
    registrations = loadRepository(databasePath).listRegistrations();
  });

  afterAll(() => {
    process.env.DATABASE_PATH = originalDatabasePath;
    delete (globalThis as {appDatabase?: unknown}).appDatabase;
  });

  it('deve manter os cadastros antigos na listagem', () => {
    expect(registrations.map(registration => registration.name)).toEqual([
      'Joao Pedro',
      'Brenda Marques',
    ]);
  });

  it('deve deixar WhatsApp e e-mail em branco nos cadastros antigos', () => {
    for (const registration of registrations) {
      expect(registration.whatsapp).toBe('');
      expect(registration.email).toBe('');
    }
  });

  it('deve preservar nome, cidade e data de cada cadastro antigo', () => {
    expect(registrations[1]).toEqual({
      id: 1,
      name: 'Brenda Marques',
      whatsapp: '',
      email: '',
      city: 'Açailândia',
      createdAt: '2026-08-24 14:33:18',
    });
  });

  it('deve guardar os dados originais com CPF na tabela arquivada', () => {
    const database = new DatabaseSync(databasePath);
    const archived = database
      .prepare('SELECT name, cpf FROM registrations_legacy_cpf ORDER BY id')
      .all() as unknown as {name: string; cpf: string}[];
    database.close();

    expect(archived).toEqual([
      {name: 'Brenda Marques', cpf: '05745650354'},
      {name: 'Joao Pedro', cpf: '52998224725'},
    ]);
  });

  it('deve aceitar cadastros novos ao lado dos antigos', () => {
    const repository = loadRepository(databasePath);
    repository.upsertRegistration({
      name: 'Maria Silva',
      whatsapp: '98999887766',
      email: 'maria@exemplo.com',
      city: 'São Luís',
    });

    const all = repository.listRegistrations();
    expect(all).toHaveLength(3);
    expect(all[0].whatsapp).toBe('98999887766');
  });

  it('não deve rodar de novo em um banco já migrado', () => {
    const repository = loadRepository(databasePath);
    expect(repository.listRegistrations()).toHaveLength(3);
  });
});

describe('migração dos cadastros com e-mail repetido', () => {
  const originalDatabasePath = process.env.DATABASE_PATH;
  let databasePath: string;
  let registrations: Registration[];

  beforeAll(() => {
    databasePath = createDuplicateEmailDatabase();
    registrations = loadRepository(databasePath).listRegistrations();
  });

  afterAll(() => {
    process.env.DATABASE_PATH = originalDatabasePath;
    delete (globalThis as {appDatabase?: unknown}).appDatabase;
  });

  it('deve manter apenas o cadastro mais recente de cada e-mail', () => {
    expect(registrations.map(registration => registration.name).sort()).toEqual(
      ['Ana Souza', 'Brenda Marques', 'Joao Pedro', 'Maria S. Santos'],
    );
  });

  it('deve preservar os cadastros antigos sem e-mail', () => {
    const withoutEmail = registrations.filter(
      registration => registration.email === '',
    );
    expect(withoutEmail.map(registration => registration.name).sort()).toEqual([
      'Brenda Marques',
      'Joao Pedro',
    ]);
  });

  it('deve guardar o cadastro descartado na tabela de duplicados', () => {
    const database = new DatabaseSync(databasePath);
    const discarded = database
      .prepare('SELECT name, email FROM registrations_duplicate_email')
      .all() as unknown as {name: string; email: string}[];
    database.close();

    expect(discarded).toEqual([
      {name: 'Maria Silva', email: 'maria@exemplo.com'},
    ]);
  });

  it('deve recusar novo cadastro com e-mail já usado', () => {
    const repository = loadRepository(databasePath);

    expect(() =>
      repository.upsertRegistration({
        name: 'Carlos Lima',
        whatsapp: '98966554433',
        email: 'ana@exemplo.com',
        city: 'Bacabal',
      }),
    ).toThrow();
  });

  it('não deve rodar de novo em um banco já migrado', () => {
    const repository = loadRepository(databasePath);
    expect(repository.listRegistrations()).toHaveLength(4);
  });
});
