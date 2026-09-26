import {
  ADMIN_PAGE_SIZE,
  buildPageHref,
  getPageWindow,
  paginate,
  parseGroupCityFilters,
  parseMunicipalityFilters,
  parseRegistrationFilters,
  parsePageNumber,
  parseSignatureFilters,
  parseSignatureRequestFilters,
  queryGroupCities,
  queryMunicipalities,
  queryRegistrations,
  querySignatureRequests,
  querySignatures,
} from '../adminTable';
import type {
  GroupCityRow,
  MunicipalityProgress,
  Registration,
  Signature,
  SignatureRequest,
} from '../types';

const makeSignature = (
  id: number,
  name: string,
  city: string,
  createdAt: string,
): Signature => ({
  id,
  name,
  city,
  createdAt,
  cpf: '00000000000',
  email: `${id}@exemplo.com`,
  receipt: `R${id}`,
  proposalHash: 'hash',
  entryHash: 'entry',
});

const makeRequest = (
  id: number,
  name: string,
  email: string,
  city: string,
): SignatureRequest => ({
  id,
  name,
  email,
  city,
  cpf: '00000000000',
  status: 'pending',
  ipHash: '',
  userAgent: '',
  proposalHash: 'hash',
  documentHash: 'doc',
  consentText: '',
  readingText: '',
  createdAt: `2026-09-0${id} 10:00:00`,
  expiresAt: `2026-09-1${id} 10:00:00`,
  confirmedAt: null,
  receipt: null,
});

const makeMunicipality = (
  city: string,
  electorate: number,
  signatures: number,
  isQualified: boolean,
): MunicipalityProgress => ({
  city,
  electorate,
  signatures,
  isQualified,
  goal: 10,
  ratio: signatures / electorate,
});

const signatures = [
  makeSignature(1, 'Bruno Lima', 'São Luís', '2026-09-01 10:00:00'),
  makeSignature(2, 'Ana Souza', 'Imperatriz', '2026-09-03 10:00:00'),
  makeSignature(3, 'Carla Dias', 'São Luís', '2026-09-02 10:00:00'),
  makeSignature(4, 'Álvaro Reis', 'Caxias', '2026-09-04 10:00:00'),
];

const idsOf = (items: {id: number}[]): number[] => items.map(item => item.id);

describe('adminTable', () => {
  describe('paginação', () => {
    it('deve limitar cada página a 50 itens', () => {
      const items = Array.from({length: 120}, (unused, index) => index);
      const page = paginate(items, 2);
      expect(ADMIN_PAGE_SIZE).toBe(50);
      expect(page.items).toHaveLength(50);
      expect(page.items[0]).toBe(50);
      expect(page).toMatchObject({
        page: 2,
        totalPages: 3,
        totalItems: 120,
        firstItem: 51,
        lastItem: 100,
      });
    });

    it('deve levar para a última página quando a página pedida não existe', () => {
      const page = paginate([1, 2, 3], 9);
      expect(page).toMatchObject({page: 1, totalPages: 1, lastItem: 3});
    });

    it('deve informar zero itens quando a lista está vazia', () => {
      expect(paginate([], 1)).toMatchObject({
        items: [],
        totalPages: 1,
        firstItem: 0,
        lastItem: 0,
      });
    });

    it('deve aceitar apenas números de página positivos', () => {
      expect(parsePageNumber('3')).toBe(3);
      expect(parsePageNumber('0')).toBe(1);
      expect(parsePageNumber('abc')).toBe(1);
      expect(parsePageNumber('')).toBe(1);
    });

    it('deve mostrar até duas páginas vizinhas', () => {
      expect(getPageWindow(1, 10)).toEqual([1, 2, 3]);
      expect(getPageWindow(5, 10)).toEqual([3, 4, 5, 6, 7]);
      expect(getPageWindow(10, 10)).toEqual([8, 9, 10]);
    });

    it('deve montar o link preservando os filtros preenchidos', () => {
      expect(
        buildPageHref('/admin/pec/assinaturas', {name: 'ana', city: ''}, 2),
      ).toBe('/admin/pec/assinaturas?name=ana&page=2');
      expect(buildPageHref('/admin/pec/assinaturas', {city: ''}, 1)).toBe(
        '/admin/pec/assinaturas',
      );
    });
  });

  describe('assinaturas', () => {
    it('deve ordenar das mais recentes por padrão', () => {
      const result = querySignatures(signatures, parseSignatureFilters({}));
      expect(idsOf(result.items)).toEqual([4, 2, 3, 1]);
    });

    it('deve ordenar das mais antigas', () => {
      const result = querySignatures(
        signatures,
        parseSignatureFilters({sort: 'oldest'}),
      );
      expect(idsOf(result.items)).toEqual([1, 3, 2, 4]);
    });

    it('deve ordenar por nome em ordem alfabética, ignorando acentos', () => {
      const result = querySignatures(
        signatures,
        parseSignatureFilters({sort: 'name'}),
      );
      expect(idsOf(result.items)).toEqual([4, 2, 1, 3]);
    });

    it('deve agrupar primeiro a cidade com mais assinaturas', () => {
      const result = querySignatures(
        signatures,
        parseSignatureFilters({sort: 'city'}),
      );
      expect(result.items.map(item => item.city)).toEqual([
        'São Luís',
        'São Luís',
        'Caxias',
        'Imperatriz',
      ]);
    });

    it('deve filtrar por nome e cidade sem diferenciar acentos e maiúsculas', () => {
      const result = querySignatures(
        signatures,
        parseSignatureFilters({name: 'carla', city: 'sao luis'}),
      );
      expect(idsOf(result.items)).toEqual([3]);
    });

    it('deve usar a ordenação padrão quando a opção é desconhecida', () => {
      expect(parseSignatureFilters({sort: 'invalida'}).sort).toBe('recent');
    });
  });

  describe('aguardando confirmação', () => {
    const requests = [
      makeRequest(1, 'Ana Souza', 'ana@exemplo.com', 'Caxias'),
      makeRequest(2, 'Bruno Lima', 'bruno@teste.com', 'Imperatriz'),
    ];

    it('deve filtrar por e-mail', () => {
      const result = querySignatureRequests(
        requests,
        parseSignatureRequestFilters({email: 'TESTE'}),
      );
      expect(idsOf(result.items)).toEqual([2]);
    });

    it('deve combinar nome e cidade', () => {
      const result = querySignatureRequests(
        requests,
        parseSignatureRequestFilters({name: 'ana', city: 'imperatriz'}),
      );
      expect(result.items).toEqual([]);
    });
  });

  describe('municípios', () => {
    const municipalities = [
      makeMunicipality('Caxias', 1000, 5, false),
      makeMunicipality('São Luís', 9000, 30, true),
      makeMunicipality('Balsas', 500, 20, true),
    ];

    const citiesOf = (items: MunicipalityProgress[]): string[] =>
      items.map(item => item.city);

    it('deve ordenar por mais assinaturas por padrão', () => {
      const result = queryMunicipalities(
        municipalities,
        parseMunicipalityFilters({}),
      );
      expect(citiesOf(result.items)).toEqual(['São Luís', 'Balsas', 'Caxias']);
    });

    it('deve ordenar por número de eleitores', () => {
      const result = queryMunicipalities(
        municipalities,
        parseMunicipalityFilters({sort: 'electorate'}),
      );
      expect(citiesOf(result.items)).toEqual(['São Luís', 'Caxias', 'Balsas']);
    });

    it('deve ordenar por nome', () => {
      const result = queryMunicipalities(
        municipalities,
        parseMunicipalityFilters({sort: 'name'}),
      );
      expect(citiesOf(result.items)).toEqual(['Balsas', 'Caxias', 'São Luís']);
    });

    it('deve filtrar por nome da cidade e situação da meta', () => {
      expect(
        citiesOf(
          queryMunicipalities(
            municipalities,
            parseMunicipalityFilters({city: 'sao'}),
          ).items,
        ),
      ).toEqual(['São Luís']);
      expect(
        citiesOf(
          queryMunicipalities(
            municipalities,
            parseMunicipalityFilters({status: 'pending'}),
          ).items,
        ),
      ).toEqual(['Caxias']);
    });
  });

  describe('cadastros dos grupos', () => {
    const registrations: Registration[] = [
      {
        id: 1,
        name: 'Bruno Lima',
        whatsapp: '98999990001',
        email: 'b@x.com',
        city: 'Caxias',
        createdAt: '2026-09-01 10:00:00',
      },
      {
        id: 2,
        name: 'Ana Souza',
        whatsapp: '98999990002',
        email: 'a@x.com',
        city: 'São Luís',
        createdAt: '2026-09-02 10:00:00',
      },
      {
        id: 3,
        name: 'Carla Dias',
        whatsapp: '98999990003',
        email: 'c@x.com',
        city: 'São Luís',
        createdAt: '2026-09-03 10:00:00',
      },
    ];

    it('deve filtrar por nome e cidade', () => {
      const result = queryRegistrations(
        registrations,
        parseRegistrationFilters({name: 'ana', city: 'sao'}),
      );
      expect(idsOf(result.items)).toEqual([2]);
    });

    it('deve agrupar primeiro a cidade com mais cadastros', () => {
      const result = queryRegistrations(
        registrations,
        parseRegistrationFilters({sort: 'city'}),
      );
      expect(idsOf(result.items)).toEqual([3, 2, 1]);
    });
  });

  describe('grupos por cidade', () => {
    const group = {
      id: 1,
      city: 'Caxias',
      whatsappLink: 'https://chat.whatsapp.com/abc',
      createdAt: '2026-09-01 10:00:00',
      updatedAt: '2026-09-01 10:00:00',
    };
    const rows: GroupCityRow[] = [
      {city: 'Balsas', group: null, registrations: 2},
      {city: 'Caxias', group, registrations: 1},
      {city: 'São Luís', group: null, registrations: 7},
    ];

    const citiesOf = (items: GroupCityRow[]): string[] =>
      items.map(item => item.city);

    it('deve ordenar por nome por padrão', () => {
      const result = queryGroupCities(rows, parseGroupCityFilters({}));
      expect(citiesOf(result.items)).toEqual(['Balsas', 'Caxias', 'São Luís']);
    });

    it('deve ordenar pela cidade com mais cadastros', () => {
      const result = queryGroupCities(
        rows,
        parseGroupCityFilters({sort: 'registrations'}),
      );
      expect(citiesOf(result.items)).toEqual(['São Luís', 'Balsas', 'Caxias']);
    });

    it('deve filtrar cidades com e sem grupo', () => {
      expect(
        citiesOf(
          queryGroupCities(rows, parseGroupCityFilters({status: 'with-group'}))
            .items,
        ),
      ).toEqual(['Caxias']);
      expect(
        citiesOf(
          queryGroupCities(
            rows,
            parseGroupCityFilters({status: 'without-group', city: 'luis'}),
          ).items,
        ),
      ).toEqual(['São Luís']);
    });
  });
});
