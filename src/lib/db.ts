import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {DatabaseSync} from 'node:sqlite';
import electorateSeed from '@/data/eleitorado-ma.json';

const LEGACY_REGISTRATIONS_COLUMN = 'cpf';

const LEGACY_REGISTRATIONS_TABLE = 'registrations_legacy_cpf';

const BUSY_TIMEOUT_MS = 5000;

const REGISTRATIONS_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    whatsapp TEXT UNIQUE,
    email TEXT,
    city TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const migrateLegacyCpfRegistrations = (database: DatabaseSync): void => {
  const table = database
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'registrations'",
    )
    .get() as unknown as {sql: string} | undefined;
  if (!table || !table.sql.includes(LEGACY_REGISTRATIONS_COLUMN)) {
    return;
  }
  database.exec(`
    BEGIN;
    DROP TABLE IF EXISTS ${LEGACY_REGISTRATIONS_TABLE};
    ALTER TABLE registrations RENAME TO ${LEGACY_REGISTRATIONS_TABLE};
    ${REGISTRATIONS_TABLE_SCHEMA}
    INSERT INTO registrations (id, name, whatsapp, email, city, created_at)
      SELECT id, name, NULL, NULL, city, created_at
      FROM ${LEGACY_REGISTRATIONS_TABLE}
      WHERE id IN (SELECT MAX(id) FROM ${LEGACY_REGISTRATIONS_TABLE} GROUP BY cpf);
    COMMIT;
  `);
};

const electorateSignature = (): string =>
  crypto
    .createHash('sha256')
    .update(JSON.stringify(electorateSeed))
    .digest('hex');

const syncElectorate = (database: DatabaseSync): void => {
  const signature = electorateSignature();
  const current = database
    .prepare('SELECT signature FROM electorate_source WHERE id = 1')
    .get() as unknown as {signature: string} | undefined;
  if (current?.signature === signature) {
    return;
  }
  const upsert = database.prepare(
    `INSERT INTO municipality_electorate (city, electorate) VALUES (?, ?)
     ON CONFLICT (city) DO UPDATE SET electorate = excluded.electorate`,
  );
  database.exec('BEGIN;');
  for (const [city, electorate] of Object.entries(electorateSeed.municipios)) {
    upsert.run(city, electorate);
  }
  database
    .prepare(
      `INSERT OR REPLACE INTO electorate_source (id, origin, reference, updated_at, signature)
     VALUES (1, ?, ?, ?, ?)`,
    )
    .run(
      electorateSeed.origem,
      electorateSeed.referencia,
      electorateSeed.atualizadoEm,
      signature,
    );
  database.exec('COMMIT;');
};

const createDatabase = (): DatabaseSync => {
  const databasePath =
    process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
  fs.mkdirSync(path.dirname(databasePath), {recursive: true});
  const database = new DatabaseSync(databasePath);
  database.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS};`);
  database.exec('PRAGMA journal_mode = WAL;');
  migrateLegacyCpfRegistrations(database);
  database.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL UNIQUE,
      whatsapp_link TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    ${REGISTRATIONS_TABLE_SCHEMA}
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS signatures (
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
    CREATE INDEX IF NOT EXISTS signatures_city ON signatures (city);
    CREATE TABLE IF NOT EXISTS proposal_versions (
      hash TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      document_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS municipality_electorate (
      city TEXT PRIMARY KEY,
      electorate INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS electorate_source (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      origin TEXT NOT NULL,
      reference TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      signature TEXT NOT NULL
    );
  `);
  syncElectorate(database);
  return database;
};

const globalForDb = globalThis as typeof globalThis & {
  appDatabase?: DatabaseSync;
};

export const getDb = (): DatabaseSync =>
  globalForDb.appDatabase ?? (globalForDb.appDatabase = createDatabase());
