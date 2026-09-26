import {normalizeSearchText} from './text';
import type {
  EntrySort,
  FilterOption,
  GroupCityFilters,
  GroupCityRow,
  GroupCitySort,
  GroupCityStatus,
  MunicipalityFilters,
  MunicipalityProgress,
  MunicipalitySort,
  MunicipalityStatus,
  Registration,
  RegistrationFilters,
  SearchParams,
  Signature,
  SignatureFilters,
  SignatureRequest,
  SignatureRequestFilters,
  TablePage,
} from './types';

export const ADMIN_PAGE_SIZE = 50;

const LOCALE = 'pt-BR';

const FIRST_PAGE = 1;

const PAGE_WINDOW_RADIUS = 2;

export const ENTRY_SORT_OPTIONS: FilterOption<EntrySort>[] = [
  {value: 'recent', label: 'Mais recentes'},
  {value: 'oldest', label: 'Mais antigas'},
  {value: 'name', label: 'Nome (A–Z)'},
  {value: 'city', label: 'Cidade com mais assinaturas'},
];

export const REQUEST_SORT_OPTIONS: FilterOption<EntrySort>[] =
  ENTRY_SORT_OPTIONS.map(option =>
    option.value === 'city'
      ? {...option, label: 'Cidade com mais pedidos'}
      : option,
  );

export const REGISTRATION_SORT_OPTIONS: FilterOption<EntrySort>[] =
  ENTRY_SORT_OPTIONS.map(option =>
    option.value === 'city'
      ? {...option, label: 'Cidade com mais cadastros'}
      : option,
  );

export const GROUP_CITY_SORT_OPTIONS: FilterOption<GroupCitySort>[] = [
  {value: 'name', label: 'Nome (A–Z)'},
  {value: 'registrations', label: 'Mais cadastros'},
];

export const GROUP_CITY_STATUS_OPTIONS: FilterOption<GroupCityStatus>[] = [
  {value: 'all', label: 'Todos'},
  {value: 'with-group', label: 'Com grupo'},
  {value: 'without-group', label: 'Sem grupo'},
];

export const MUNICIPALITY_SORT_OPTIONS: FilterOption<MunicipalitySort>[] = [
  {value: 'signatures', label: 'Mais assinaturas'},
  {value: 'electorate', label: 'Mais eleitores'},
  {value: 'progress', label: 'Maior progresso'},
  {value: 'name', label: 'Nome (A–Z)'},
];

export const MUNICIPALITY_STATUS_OPTIONS: FilterOption<MunicipalityStatus>[] = [
  {value: 'all', label: 'Todos'},
  {value: 'qualified', label: 'Meta atingida'},
  {value: 'pending', label: 'Em andamento'},
];

type ListedEntry = {
  id: number;
  name: string;
  city: string;
  createdAt: string;
};

const readParam = (params: SearchParams, key: string): string => {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
};

const readOption = <T extends string>(
  params: SearchParams,
  key: string,
  options: FilterOption<T>[],
): T => {
  const value = readParam(params, key);
  return (
    options.find(option => option.value === value)?.value ?? options[0].value
  );
};

export const parsePageNumber = (value: string): number => {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page >= FIRST_PAGE ? page : FIRST_PAGE;
};

export const paginate = <T>(
  items: T[],
  page: number,
  pageSize: number = ADMIN_PAGE_SIZE,
): TablePage<T> => {
  const totalPages = Math.max(FIRST_PAGE, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(page, FIRST_PAGE), totalPages);
  const start = (current - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    items: pageItems,
    page: current,
    totalPages,
    totalItems: items.length,
    firstItem: pageItems.length > 0 ? start + 1 : 0,
    lastItem: start + pageItems.length,
  };
};

export const getPageWindow = (page: number, totalPages: number): number[] => {
  const first = Math.max(FIRST_PAGE, page - PAGE_WINDOW_RADIUS);
  const last = Math.min(totalPages, page + PAGE_WINDOW_RADIUS);
  return Array.from(
    {length: last - first + 1},
    (unused, index) => first + index,
  );
};

export const buildPageHref = (
  basePath: string,
  params: Record<string, string>,
  page: number,
): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }
  if (page > FIRST_PAGE) {
    query.set('page', String(page));
  }
  const search = query.toString();
  return search ? `${basePath}?${search}` : basePath;
};

const matchesText = (value: string, query: string): boolean =>
  !query || normalizeSearchText(value).includes(normalizeSearchText(query));

const compareRecent = (a: ListedEntry, b: ListedEntry): number =>
  b.createdAt.localeCompare(a.createdAt) || b.id - a.id;

const countByCity = (entries: ListedEntry[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.city, (counts.get(entry.city) ?? 0) + 1);
  }
  return counts;
};

export const sortEntries = <T extends ListedEntry>(
  entries: T[],
  sort: EntrySort,
): T[] => {
  const sorted = [...entries];
  if (sort === 'oldest') {
    return sorted.sort((a, b) => compareRecent(b, a));
  }
  if (sort === 'name') {
    return sorted.sort(
      (a, b) => a.name.localeCompare(b.name, LOCALE) || compareRecent(a, b),
    );
  }
  if (sort === 'city') {
    const counts = countByCity(entries);
    return sorted.sort(
      (a, b) =>
        (counts.get(b.city) ?? 0) - (counts.get(a.city) ?? 0) ||
        a.city.localeCompare(b.city, LOCALE) ||
        compareRecent(a, b),
    );
  }
  return sorted.sort(compareRecent);
};

export const parseSignatureFilters = (
  params: SearchParams,
): SignatureFilters => ({
  name: readParam(params, 'name'),
  city: readParam(params, 'city'),
  sort: readOption(params, 'sort', ENTRY_SORT_OPTIONS),
  page: parsePageNumber(readParam(params, 'page')),
});

export const parseSignatureRequestFilters = (
  params: SearchParams,
): SignatureRequestFilters => ({
  ...parseSignatureFilters(params),
  email: readParam(params, 'email'),
});

export const parseMunicipalityFilters = (
  params: SearchParams,
): MunicipalityFilters => ({
  city: readParam(params, 'city'),
  status: readOption(params, 'status', MUNICIPALITY_STATUS_OPTIONS),
  sort: readOption(params, 'sort', MUNICIPALITY_SORT_OPTIONS),
  page: parsePageNumber(readParam(params, 'page')),
});

export const querySignatures = (
  signatures: Signature[],
  filters: SignatureFilters,
): TablePage<Signature> =>
  paginate(
    sortEntries(
      signatures.filter(
        signature =>
          matchesText(signature.name, filters.name) &&
          matchesText(signature.city, filters.city),
      ),
      filters.sort,
    ),
    filters.page,
  );

export const querySignatureRequests = (
  requests: SignatureRequest[],
  filters: SignatureRequestFilters,
): TablePage<SignatureRequest> =>
  paginate(
    sortEntries(
      requests.filter(
        request =>
          matchesText(request.name, filters.name) &&
          matchesText(request.email, filters.email) &&
          matchesText(request.city, filters.city),
      ),
      filters.sort,
    ),
    filters.page,
  );

const matchesStatus = (
  municipality: MunicipalityProgress,
  status: MunicipalityStatus,
): boolean => {
  if (status === 'qualified') {
    return municipality.isQualified;
  }
  if (status === 'pending') {
    return !municipality.isQualified;
  }
  return true;
};

const compareMunicipalityName = (
  a: MunicipalityProgress,
  b: MunicipalityProgress,
): number => a.city.localeCompare(b.city, LOCALE);

const MUNICIPALITY_COMPARATORS: Record<
  MunicipalitySort,
  (a: MunicipalityProgress, b: MunicipalityProgress) => number
> = {
  signatures: (a, b) =>
    b.signatures - a.signatures || compareMunicipalityName(a, b),
  electorate: (a, b) =>
    b.electorate - a.electorate || compareMunicipalityName(a, b),
  progress: (a, b) =>
    b.ratio - a.ratio ||
    b.signatures - a.signatures ||
    compareMunicipalityName(a, b),
  name: compareMunicipalityName,
};

export const queryMunicipalities = (
  municipalities: MunicipalityProgress[],
  filters: MunicipalityFilters,
): TablePage<MunicipalityProgress> =>
  paginate(
    municipalities
      .filter(
        municipality =>
          matchesStatus(municipality, filters.status) &&
          matchesText(municipality.city, filters.city),
      )
      .sort(MUNICIPALITY_COMPARATORS[filters.sort]),
    filters.page,
  );

export const parseRegistrationFilters = (
  params: SearchParams,
): RegistrationFilters => parseSignatureFilters(params);

export const queryRegistrations = (
  registrations: Registration[],
  filters: RegistrationFilters,
): TablePage<Registration> =>
  paginate(
    sortEntries(
      registrations.filter(
        registration =>
          matchesText(registration.name, filters.name) &&
          matchesText(registration.city, filters.city),
      ),
      filters.sort,
    ),
    filters.page,
  );

export const parseGroupCityFilters = (
  params: SearchParams,
): GroupCityFilters => ({
  city: readParam(params, 'city'),
  status: readOption(params, 'status', GROUP_CITY_STATUS_OPTIONS),
  sort: readOption(params, 'sort', GROUP_CITY_SORT_OPTIONS),
  page: parsePageNumber(readParam(params, 'page')),
});

const matchesGroupStatus = (
  row: GroupCityRow,
  status: GroupCityStatus,
): boolean => {
  if (status === 'with-group') {
    return Boolean(row.group);
  }
  if (status === 'without-group') {
    return !row.group;
  }
  return true;
};

const compareGroupCityName = (a: GroupCityRow, b: GroupCityRow): number =>
  a.city.localeCompare(b.city, LOCALE);

const GROUP_CITY_COMPARATORS: Record<
  GroupCitySort,
  (a: GroupCityRow, b: GroupCityRow) => number
> = {
  name: compareGroupCityName,
  registrations: (a, b) =>
    b.registrations - a.registrations || compareGroupCityName(a, b),
};

export const queryGroupCities = (
  rows: GroupCityRow[],
  filters: GroupCityFilters,
): TablePage<GroupCityRow> =>
  paginate(
    rows
      .filter(
        row =>
          matchesGroupStatus(row, filters.status) &&
          matchesText(row.city, filters.city),
      )
      .sort(GROUP_CITY_COMPARATORS[filters.sort]),
    filters.page,
  );
