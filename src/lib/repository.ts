import {getDb} from './db';
import type {Group, Registration, RegistrationInput} from './types';

type GroupRow = {
  id: number;
  city: string;
  whatsapp_link: string;
  created_at: string;
  updated_at: string;
};

type RegistrationRow = {
  id: number;
  name: string;
  cpf: string;
  city: string;
  created_at: string;
};

const toGroup = (row: GroupRow): Group => ({
  id: row.id,
  city: row.city,
  whatsappLink: row.whatsapp_link,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRegistration = (row: RegistrationRow): Registration => ({
  id: row.id,
  name: row.name,
  cpf: row.cpf,
  city: row.city,
  createdAt: row.created_at,
});

export const listGroups = (): Group[] =>
  (
    getDb()
      .prepare('SELECT * FROM groups ORDER BY city')
      .all() as unknown as GroupRow[]
  ).map(toGroup);

export const getGroupById = (id: number): Group | null => {
  const row = getDb()
    .prepare('SELECT * FROM groups WHERE id = ?')
    .get(id) as unknown as GroupRow | undefined;
  return row ? toGroup(row) : null;
};

export const getGroupByCity = (city: string): Group | null => {
  const row = getDb()
    .prepare('SELECT * FROM groups WHERE city = ?')
    .get(city) as unknown as GroupRow | undefined;
  return row ? toGroup(row) : null;
};

export const createGroup = (city: string, whatsappLink: string): Group => {
  const result = getDb()
    .prepare('INSERT INTO groups (city, whatsapp_link) VALUES (?, ?)')
    .run(city, whatsappLink);
  return getGroupById(Number(result.lastInsertRowid)) as Group;
};

export const updateGroupLink = (
  id: number,
  whatsappLink: string,
): Group | null => {
  getDb()
    .prepare(
      "UPDATE groups SET whatsapp_link = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .run(whatsappLink, id);
  return getGroupById(id);
};

export const deleteGroup = (id: number): boolean =>
  Number(getDb().prepare('DELETE FROM groups WHERE id = ?').run(id).changes) >
  0;

export const upsertRegistration = (input: RegistrationInput): void => {
  getDb()
    .prepare(
      `INSERT INTO registrations (name, cpf, city) VALUES (?, ?, ?)
     ON CONFLICT (cpf)
     DO UPDATE SET name = excluded.name, created_at = datetime('now')`,
    )
    .run(input.name, input.cpf, input.city);
};

export const getRegistrationByCpf = (cpf: string): Registration | null => {
  const row = getDb()
    .prepare('SELECT * FROM registrations WHERE cpf = ?')
    .get(cpf) as unknown as RegistrationRow | undefined;
  return row ? toRegistration(row) : null;
};

export const deleteRegistration = (id: number): boolean =>
  Number(
    getDb().prepare('DELETE FROM registrations WHERE id = ?').run(id).changes,
  ) > 0;

export const listRegistrations = (): Registration[] =>
  (
    getDb()
      .prepare('SELECT * FROM registrations ORDER BY created_at DESC, id DESC')
      .all() as unknown as RegistrationRow[]
  ).map(toRegistration);

const DEFAULT_GROUP_LINK_KEY = 'default_group_link';

export const getDefaultGroupLink = (): string | null => {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(DEFAULT_GROUP_LINK_KEY) as unknown as {value: string} | undefined;
  return row?.value ?? null;
};

export const setDefaultGroupLink = (whatsappLink: string): void => {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    )
    .run(DEFAULT_GROUP_LINK_KEY, whatsappLink);
};

export const clearDefaultGroupLink = (): void => {
  getDb()
    .prepare('DELETE FROM settings WHERE key = ?')
    .run(DEFAULT_GROUP_LINK_KEY);
};
