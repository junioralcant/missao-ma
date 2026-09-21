import {getDb} from './db';
import {GENESIS_HASH} from './signature';
import type {
  ElectorateSource,
  Group,
  ProposalVersion,
  Registration,
  RegistrationInput,
  Signature,
  SignatureEntry,
  SignatureInput,
  SignatureRequest,
  SignatureRequestInput,
} from './types';

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
  whatsapp: string | null;
  email: string | null;
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
  whatsapp: row.whatsapp ?? '',
  email: row.email ?? '',
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
      `INSERT INTO registrations (name, whatsapp, email, city) VALUES (?, ?, ?, ?)
     ON CONFLICT (whatsapp)
     DO UPDATE SET name = excluded.name, email = excluded.email, created_at = datetime('now')`,
    )
    .run(input.name, input.whatsapp, input.email, input.city);
};

export const getRegistrationByWhatsapp = (
  whatsapp: string,
): Registration | null => {
  const row = getDb()
    .prepare('SELECT * FROM registrations WHERE whatsapp = ?')
    .get(whatsapp) as unknown as RegistrationRow | undefined;
  return row ? toRegistration(row) : null;
};

export const getRegistrationByEmail = (email: string): Registration | null => {
  const row = getDb()
    .prepare('SELECT * FROM registrations WHERE email = ?')
    .get(email) as unknown as RegistrationRow | undefined;
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

type SignatureRow = {
  id: number;
  name: string;
  cpf: string;
  email: string | null;
  city: string;
  receipt: string;
  proposal_hash: string;
  entry_hash: string;
  created_at: string;
};

type SignatureEntryRow = {
  id: number;
  name: string;
  cpf: string;
  city: string;
  proposal_hash: string;
  document_hash: string;
  consent_text: string;
  reading_text: string;
  created_at: string;
  prev_hash: string;
  entry_hash: string;
};

type ProposalVersionRow = {
  hash: string;
  title: string;
  summary: string;
  document_url: string;
  created_at: string;
};

type CityCountRow = {
  city: string;
  total: number;
};

type ElectorateRow = {
  city: string;
  electorate: number;
};

type ElectorateSourceRow = {
  origin: string;
  reference: string;
  updated_at: string;
};

const SIGNATURE_COLUMNS =
  'id, name, cpf, email, city, receipt, proposal_hash, entry_hash, created_at';

const toSignature = (row: SignatureRow): Signature => ({
  id: row.id,
  name: row.name,
  cpf: row.cpf,
  email: row.email ?? '',
  city: row.city,
  receipt: row.receipt,
  proposalHash: row.proposal_hash,
  entryHash: row.entry_hash,
  createdAt: row.created_at,
});

const toSignatureEntry = (row: SignatureEntryRow): SignatureEntry => ({
  id: row.id,
  name: row.name,
  cpf: row.cpf,
  city: row.city,
  proposalHash: row.proposal_hash,
  documentHash: row.document_hash,
  consentText: row.consent_text,
  readingText: row.reading_text,
  createdAt: row.created_at,
  prevHash: row.prev_hash,
  entryHash: row.entry_hash,
});

const toProposalVersion = (row: ProposalVersionRow): ProposalVersion => ({
  hash: row.hash,
  title: row.title,
  summary: row.summary,
  documentUrl: row.document_url,
  createdAt: row.created_at,
});

export const appendSignature = (
  input: SignatureInput,
  buildHash: (prevHash: string) => string,
): void => {
  const database = getDb();
  database.exec('BEGIN IMMEDIATE;');
  try {
    const head = database
      .prepare('SELECT entry_hash FROM signatures ORDER BY id DESC LIMIT 1')
      .get() as unknown as {entry_hash: string} | undefined;
    const prevHash = head?.entry_hash ?? GENESIS_HASH;
    database
      .prepare(
        `INSERT INTO signatures
       (name, cpf, email, city, receipt, ip_hash, user_agent, proposal_hash, document_hash, consent_text, reading_text, prev_hash, entry_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.name,
        input.cpf,
        input.email,
        input.city,
        input.receipt,
        input.ipHash,
        input.userAgent,
        input.proposalHash,
        input.documentHash,
        input.consentText,
        input.readingText,
        prevHash,
        buildHash(prevHash),
        input.createdAt,
      );
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
};

export const listSignatureEntries = (): SignatureEntry[] =>
  (
    getDb()
      .prepare(
        `SELECT id, name, cpf, city, proposal_hash, document_hash, consent_text, reading_text, created_at, prev_hash, entry_hash
       FROM signatures ORDER BY id`,
      )
      .all() as unknown as SignatureEntryRow[]
  ).map(toSignatureEntry);

export const saveProposalVersion = (version: ProposalVersion): void => {
  getDb()
    .prepare(
      `INSERT INTO proposal_versions (hash, title, summary, document_url, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (hash) DO NOTHING`,
    )
    .run(
      version.hash,
      version.title,
      version.summary,
      version.documentUrl,
      version.createdAt,
    );
};

export const listProposalVersions = (): ProposalVersion[] =>
  (
    getDb()
      .prepare('SELECT * FROM proposal_versions ORDER BY created_at DESC, hash')
      .all() as unknown as ProposalVersionRow[]
  ).map(toProposalVersion);

export const countSignaturesByProposalHash = (): Record<string, number> => {
  const rows = getDb()
    .prepare(
      'SELECT proposal_hash AS hash, COUNT(*) AS total FROM signatures GROUP BY proposal_hash',
    )
    .all() as unknown as {hash: string; total: number}[];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.hash] = Number(row.total);
  }
  return counts;
};

export const getSignatureByCpf = (cpf: string): Signature | null => {
  const row = getDb()
    .prepare(`SELECT ${SIGNATURE_COLUMNS} FROM signatures WHERE cpf = ?`)
    .get(cpf) as unknown as SignatureRow | undefined;
  return row ? toSignature(row) : null;
};

export const getSignatureById = (id: number): Signature | null => {
  const row = getDb()
    .prepare(`SELECT ${SIGNATURE_COLUMNS} FROM signatures WHERE id = ?`)
    .get(id) as unknown as SignatureRow | undefined;
  return row ? toSignature(row) : null;
};

export const getSignatureByEmail = (email: string): Signature | null => {
  const row = getDb()
    .prepare(`SELECT ${SIGNATURE_COLUMNS} FROM signatures WHERE email = ?`)
    .get(email) as unknown as SignatureRow | undefined;
  return row ? toSignature(row) : null;
};

export const listSignatures = (): Signature[] =>
  (
    getDb()
      .prepare(
        `SELECT ${SIGNATURE_COLUMNS} FROM signatures ORDER BY created_at DESC, id DESC`,
      )
      .all() as unknown as SignatureRow[]
  ).map(toSignature);

export const deleteSignature = (id: number): boolean =>
  Number(
    getDb().prepare('DELETE FROM signatures WHERE id = ?').run(id).changes,
  ) > 0;

export const countSignaturesByCity = (): Record<string, number> => {
  const rows = getDb()
    .prepare('SELECT city, COUNT(*) AS total FROM signatures GROUP BY city')
    .all() as unknown as CityCountRow[];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.city] = Number(row.total);
  }
  return counts;
};

export const getElectorate = (): Record<string, number> => {
  const rows = getDb()
    .prepare('SELECT city, electorate FROM municipality_electorate')
    .all() as unknown as ElectorateRow[];
  const electorate: Record<string, number> = {};
  for (const row of rows) {
    electorate[row.city] = Number(row.electorate);
  }
  return electorate;
};

export const getElectorateSource = (): ElectorateSource | null => {
  const row = getDb()
    .prepare(
      'SELECT origin, reference, updated_at FROM electorate_source WHERE id = 1',
    )
    .get() as unknown as ElectorateSourceRow | undefined;
  return row
    ? {origin: row.origin, reference: row.reference, updatedAt: row.updated_at}
    : null;
};

export const getSetting = (key: string): string | null => {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as unknown as {value: string} | undefined;
  return row?.value ?? null;
};

export const setSetting = (key: string, value: string): void => {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
};

type SignatureRequestRow = {
  id: number;
  name: string;
  cpf: string;
  email: string;
  city: string;
  status: string;
  ip_hash: string;
  user_agent: string;
  proposal_hash: string;
  document_hash: string;
  consent_text: string;
  reading_text: string;
  created_at: string;
  expires_at: string;
  confirmed_at: string | null;
  receipt: string | null;
};

const SIGNATURE_REQUEST_COLUMNS =
  'id, name, cpf, email, city, status, ip_hash, user_agent, proposal_hash, document_hash, consent_text, reading_text, created_at, expires_at, confirmed_at, receipt';

const toSignatureRequest = (row: SignatureRequestRow): SignatureRequest => ({
  id: row.id,
  name: row.name,
  cpf: row.cpf,
  email: row.email,
  city: row.city,
  status: row.status === 'confirmed' ? 'confirmed' : 'pending',
  ipHash: row.ip_hash,
  userAgent: row.user_agent,
  proposalHash: row.proposal_hash,
  documentHash: row.document_hash,
  consentText: row.consent_text,
  readingText: row.reading_text,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  confirmedAt: row.confirmed_at,
  receipt: row.receipt,
});

export const upsertSignatureRequest = (input: SignatureRequestInput): void => {
  const database = getDb();
  database.exec('BEGIN IMMEDIATE;');
  try {
    database
      .prepare('DELETE FROM signature_requests WHERE cpf = ? OR email = ?')
      .run(input.cpf, input.email);
    database
      .prepare(
        `INSERT INTO signature_requests
       (name, cpf, email, city, token_hash, status, ip_hash, user_agent, proposal_hash, document_hash, consent_text, reading_text, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.name,
        input.cpf,
        input.email,
        input.city,
        input.tokenHash,
        input.ipHash,
        input.userAgent,
        input.proposalHash,
        input.documentHash,
        input.consentText,
        input.readingText,
        input.createdAt,
        input.expiresAt,
      );
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
};

export const getSignatureRequestByToken = (
  tokenHash: string,
): SignatureRequest | null => {
  const row = getDb()
    .prepare(
      `SELECT ${SIGNATURE_REQUEST_COLUMNS} FROM signature_requests WHERE token_hash = ?`,
    )
    .get(tokenHash) as unknown as SignatureRequestRow | undefined;
  return row ? toSignatureRequest(row) : null;
};

export const getSignatureRequestByEmail = (
  email: string,
): SignatureRequest | null => {
  const row = getDb()
    .prepare(
      `SELECT ${SIGNATURE_REQUEST_COLUMNS} FROM signature_requests WHERE email = ?`,
    )
    .get(email) as unknown as SignatureRequestRow | undefined;
  return row ? toSignatureRequest(row) : null;
};

export const confirmSignatureRequest = (
  id: number,
  receipt: string,
  confirmedAt: string,
): void => {
  getDb()
    .prepare(
      "UPDATE signature_requests SET status = 'confirmed', receipt = ?, confirmed_at = ? WHERE id = ?",
    )
    .run(receipt, confirmedAt, id);
};

export const listPendingSignatureRequests = (): SignatureRequest[] =>
  (
    getDb()
      .prepare(
        `SELECT ${SIGNATURE_REQUEST_COLUMNS} FROM signature_requests
       WHERE status = 'pending' ORDER BY created_at DESC, id DESC`,
      )
      .all() as unknown as SignatureRequestRow[]
  ).map(toSignatureRequest);

export const deleteSignatureRequestByCpf = (cpf: string): void => {
  getDb().prepare('DELETE FROM signature_requests WHERE cpf = ?').run(cpf);
};
