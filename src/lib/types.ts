export type Group = {
  id: number;
  city: string;
  whatsappLink: string;
  createdAt: string;
  updatedAt: string;
};

export type Registration = {
  id: number;
  name: string;
  whatsapp: string;
  email: string;
  city: string;
  createdAt: string;
};

export type RegistrationInput = {
  name: string;
  whatsapp: string;
  email: string;
  city: string;
};

export type Signature = {
  id: number;
  name: string;
  cpf: string;
  email: string;
  city: string;
  receipt: string;
  proposalHash: string;
  entryHash: string;
  createdAt: string;
};

export type SignatureInput = {
  name: string;
  cpf: string;
  email: string;
  city: string;
  receipt: string;
  ipHash: string;
  userAgent: string;
  proposalHash: string;
  documentHash: string;
  consentText: string;
  readingText: string;
  createdAt: string;
};

export type ElectorateSource = {
  origin: string;
  reference: string;
  updatedAt: string;
};

export type MunicipalityProgress = {
  city: string;
  electorate: number;
  goal: number;
  signatures: number;
  ratio: number;
  isQualified: boolean;
};

export type PecProgress = {
  totalSignatures: number;
  stateElectorate: number;
  stateGoal: number;
  stateRatio: number;
  isStateGoalMet: boolean;
  qualifiedCount: number;
  coverageGoal: number;
  municipalityCount: number;
  isCoverageGoalMet: boolean;
  signaturesInQualified: number;
  isStrictStateGoalMet: boolean;
  isReadyToFile: boolean;
  municipalities: MunicipalityProgress[];
};

export type ProgressInput = {
  electorate: Record<string, number>;
  signaturesByCity: Record<string, number>;
};

export type ElectorateImport = {
  electorate: Record<string, number>;
  unknownCities: string[];
  missingCities: string[];
};

export type Proposal = {
  title: string;
  summary: string;
  documentUrl: string;
  documentHash: string;
  hash: string;
};

export type ProposalVersion = {
  hash: string;
  title: string;
  summary: string;
  documentUrl: string;
  createdAt: string;
};

export type SignatureEntry = {
  id: number;
  name: string;
  cpf: string;
  city: string;
  proposalHash: string;
  documentHash: string;
  consentText: string;
  readingText: string;
  createdAt: string;
  prevHash: string;
  entryHash: string;
};

export type EntryHashInput = {
  prevHash: string;
  name: string;
  cpf: string;
  city: string;
  proposalHash: string;
  documentHash: string;
  consentText: string;
  readingText: string;
  createdAt: string;
};

export type ChainVerification = {
  total: number;
  isValid: boolean;
  brokenAtId: number | null;
  headHash: string;
};

export type ProposalDocument = {
  fileName: string;
  downloadPath: string;
  hash: string;
  title: string;
  ementa: string;
  paragraphs: string[];
  importedAt: string;
};

export type GroupCoverageCity = {
  city: string;
  group: Group | null;
};

export type GroupCoverage = {
  total: number;
  covered: number;
  missing: number;
  ratio: number;
  cities: GroupCoverageCity[];
};

export type EmailDeliveryStatus = 'sent' | 'skipped' | 'failed';

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SignatureConfirmationEmail = {
  name: string;
  city: string;
  email: string;
  token: string;
  proposalTitle: string;
};

export type SignatureRequestStatus = 'pending' | 'confirmed';

export type SignatureRequest = {
  id: number;
  name: string;
  cpf: string;
  email: string;
  city: string;
  status: SignatureRequestStatus;
  ipHash: string;
  userAgent: string;
  proposalHash: string;
  documentHash: string;
  consentText: string;
  readingText: string;
  createdAt: string;
  expiresAt: string;
  confirmedAt: string | null;
  receipt: string | null;
};

export type SignatureRequestInput = {
  name: string;
  cpf: string;
  email: string;
  city: string;
  tokenHash: string;
  ipHash: string;
  userAgent: string;
  proposalHash: string;
  documentHash: string;
  consentText: string;
  readingText: string;
  createdAt: string;
  expiresAt: string;
};

export type SignatureRequestData = {
  name: string;
  cpf: string;
  city: string;
};

export type SearchParams = Record<string, string | string[] | undefined>;

export type TablePage<T> = {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  firstItem: number;
  lastItem: number;
};

export type EntrySort = 'recent' | 'oldest' | 'name' | 'city';

export type MunicipalitySort =
  'signatures' | 'electorate' | 'name' | 'progress';

export type MunicipalityStatus = 'all' | 'qualified' | 'pending';

export type SignatureFilters = {
  name: string;
  city: string;
  sort: EntrySort;
  page: number;
};

export type SignatureRequestFilters = SignatureFilters & {
  email: string;
};

export type MunicipalityFilters = {
  city: string;
  status: MunicipalityStatus;
  sort: MunicipalitySort;
  page: number;
};

export type FilterOption<T extends string> = {
  value: T;
  label: string;
};

export type RegistrationFilters = SignatureFilters;

export type GroupCitySort = 'name' | 'registrations';

export type GroupCityStatus = 'all' | 'with-group' | 'without-group';

export type GroupCityFilters = {
  city: string;
  status: GroupCityStatus;
  sort: GroupCitySort;
  page: number;
};

export type GroupCityRow = GroupCoverageCity & {
  registrations: number;
};

export type SectionTab = {
  href: string;
  label: string;
};
