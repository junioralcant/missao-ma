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
