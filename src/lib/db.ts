import fs from 'fs';
import path from 'path';
import {DatabaseSync} from 'node:sqlite';

const LEGACY_REGISTRATIONS_UNIQUE = 'UNIQUE (cpf, city)';

const BUSY_TIMEOUT_MS = 5000;

const migrateRegistrationsToUniqueCpf = (database: DatabaseSync): void => {
  const table = database
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'registrations'",
    )
    .get() as unknown as {sql: string} | undefined;
  if (!table || !table.sql.includes(LEGACY_REGISTRATIONS_UNIQUE)) {
    return;
  }
  database.exec(`
    BEGIN;
    CREATE TABLE registrations_migrated (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO registrations_migrated (id, name, cpf, city, created_at)
      SELECT id, name, cpf, city, created_at FROM registrations
      WHERE id IN (SELECT MAX(id) FROM registrations GROUP BY cpf);
    DROP TABLE registrations;
    ALTER TABLE registrations_migrated RENAME TO registrations;
    COMMIT;
  `);
};

const createDatabase = (): DatabaseSync => {
  const databasePath =
    process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
  fs.mkdirSync(path.dirname(databasePath), {recursive: true});
  const database = new DatabaseSync(databasePath);
  database.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS};`);
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL UNIQUE,
      whatsapp_link TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  migrateRegistrationsToUniqueCpf(database);
  return database;
};

const globalForDb = globalThis as typeof globalThis & {
  appDatabase?: DatabaseSync;
};

export const getDb = (): DatabaseSync =>
  globalForDb.appDatabase ?? (globalForDb.appDatabase = createDatabase());
