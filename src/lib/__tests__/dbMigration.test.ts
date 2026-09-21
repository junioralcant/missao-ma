import fs from 'fs';
import os from 'os';
import path from 'path';
import {DatabaseSync} from 'node:sqlite';
import {verifySignatureChain} from '../integrity';
import {buildEntryHash} from '../signature';
import type {Registration} from '../types';

const LEGACY_SIGNATURE = {
  name: 'Maria Silva',
  cpf: '52998224725',
  city: 'São Luís',
  proposalHash: 'proposta-antiga',
  documentHash: 'documento-antigo',
  consentText: 'consentimento antigo',
  readingText: 'leitura antiga',
  createdAt: '2026-09-01 12:00:00',
};

const createSignaturesWithoutEmailDatabase = (): string => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'missao-ma-assinaturas-'),
  );
  const databasePath = path.join(directory, 'app.db');
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      voter_id TEXT,
      receipt TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      proposal_hash TEXT NOT NULL,
      document_hash TEXT NOT NULL,
      consent_text TEXT NOT NULL,
      reading_text TEXT NOT NULL,
      prev_hash TEXT NOT NULL,
      entry_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  database
    .prepare(
      `INSERT INTO signatures
     (name, cpf, city, receipt, ip_hash, user_agent, proposal_hash, document_hash, consent_text, reading_text, prev_hash, entry_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      LEGACY_SIGNATURE.name,
      LEGACY_SIGNATURE.cpf,
      LEGACY_SIGNATURE.city,
      'PEC-ANTIGA123',
      'hash-do-ip',
      'navegador antigo',
      LEGACY_SIGNATURE.proposalHash,
      LEGACY_SIGNATURE.documentHash,
      LEGACY_SIGNATURE.consentText,
      LEGACY_SIGNATURE.readingText,
      '',
      buildEntryHash({prevHash: '', ...LEGACY_SIGNATURE}),
      LEGACY_SIGNATURE.createdAt,
    );
  database.close();
  return databasePath;
};

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

describe('migração das assinaturas sem e-mail', () => {
  const originalDatabasePath = process.env.DATABASE_PATH;
  let databasePath: string;
  let repository: typeof import('../repository');

  beforeAll(() => {
    databasePath = createSignaturesWithoutEmailDatabase();
    repository = loadRepository(databasePath);
  });

  afterAll(() => {
    process.env.DATABASE_PATH = originalDatabasePath;
    delete (globalThis as {appDatabase?: unknown}).appDatabase;
  });

  it('deve preservar a assinatura antiga com o e-mail em branco', () => {
    expect(repository.listSignatures()).toEqual([
      {
        id: 1,
        name: 'Maria Silva',
        cpf: '52998224725',
        email: '',
        city: 'São Luís',
        receipt: 'PEC-ANTIGA123',
        proposalHash: 'proposta-antiga',
        entryHash: buildEntryHash({prevHash: '', ...LEGACY_SIGNATURE}),
        createdAt: '2026-09-01 12:00:00',
      },
    ]);
  });

  it('deve manter a cadeia de integridade válida após a migração', () => {
    expect(
      verifySignatureChain(repository.listSignatureEntries()),
    ).toMatchObject({total: 1, isValid: true, brokenAtId: null});
  });

  it('deve aceitar assinatura nova com e-mail ao lado da antiga', () => {
    repository.appendSignature(
      {
        name: 'João Pedro',
        cpf: '11144477735',
        email: 'joao@exemplo.com',
        city: 'Imperatriz',
        receipt: 'PEC-NOVA12345',
        ipHash: 'hash',
        userAgent: 'jest',
        proposalHash: 'proposta',
        documentHash: 'documento',
        consentText: 'consentimento',
        readingText: 'leitura',
        createdAt: '2026-09-21 12:00:00',
      },
      () => 'hash-da-entrada',
    );

    expect(repository.getSignatureByEmail('joao@exemplo.com')?.receipt).toBe(
      'PEC-NOVA12345',
    );
  });

  it('deve recusar segunda assinatura com o mesmo e-mail', () => {
    expect(() =>
      repository.appendSignature(
        {
          name: 'Ana Souza',
          cpf: '05745650354',
          email: 'joao@exemplo.com',
          city: 'Bacabal',
          receipt: 'PEC-OUTRA1234',
          ipHash: 'hash',
          userAgent: 'jest',
          proposalHash: 'proposta',
          documentHash: 'documento',
          consentText: 'consentimento',
          readingText: 'leitura',
          createdAt: '2026-09-21 13:00:00',
        },
        () => 'outro-hash',
      ),
    ).toThrow();
  });

  it('não deve rodar de novo em um banco já migrado', () => {
    expect(loadRepository(databasePath).listSignatures()).toHaveLength(2);
  });
});
