import municipalities from '@/data/municipios-ma.json';
import {buildGroupCoverage, withRegistrationCounts} from '../coverage';
import type {Group} from '../types';

const cities = municipalities as string[];

const makeGroup = (id: number, city: string): Group => ({
  id,
  city,
  whatsappLink: `https://chat.whatsapp.com/codigo${id}`,
  createdAt: '2026-09-17 12:00:00',
  updatedAt: '2026-09-17 12:00:00',
});

describe('buildGroupCoverage', () => {
  it('deve contar os municípios cobertos e os que faltam', () => {
    const coverage = buildGroupCoverage(cities, [
      makeGroup(1, 'São Mateus do Maranhão'),
      makeGroup(2, 'Imperatriz'),
    ]);

    expect(coverage.total).toBe(217);
    expect(coverage.covered).toBe(2);
    expect(coverage.missing).toBe(215);
    expect(coverage.ratio).toBeCloseTo(2 / 217);
  });

  it('deve listar todos os municípios em ordem alfabética', () => {
    const coverage = buildGroupCoverage(cities, []);

    expect(coverage.cities).toHaveLength(217);
    expect(coverage.cities[0].city).toBe('Açailândia');
    expect(coverage.cities.map(item => item.city)).toContain('São Luís');
  });

  it('deve associar o grupo ao município e deixar null nos demais', () => {
    const group = makeGroup(1, 'Imperatriz');
    const coverage = buildGroupCoverage(cities, [group]);
    const imperatriz = coverage.cities.find(item => item.city === 'Imperatriz');
    const balsas = coverage.cities.find(item => item.city === 'Balsas');

    expect(imperatriz?.group).toEqual(group);
    expect(balsas?.group).toBe(null);
  });

  it('deve casar a cidade do grupo ignorando acentos e caixa', () => {
    const coverage = buildGroupCoverage(cities, [
      makeGroup(1, 'sao luis'),
      makeGroup(2, 'AÇAILÂNDIA'),
    ]);

    expect(coverage.covered).toBe(2);
    expect(
      coverage.cities.find(item => item.city === 'São Luís')?.group?.id,
    ).toBe(1);
  });

  it('deve marcar cobertura total quando todos os municípios têm grupo', () => {
    const coverage = buildGroupCoverage(
      cities,
      cities.map((city, index) => makeGroup(index + 1, city)),
    );

    expect(coverage.covered).toBe(217);
    expect(coverage.missing).toBe(0);
    expect(coverage.ratio).toBe(1);
  });

  it('deve devolver proporção zero quando não há municípios', () => {
    const coverage = buildGroupCoverage([], []);

    expect(coverage).toEqual({
      total: 0,
      covered: 0,
      missing: 0,
      ratio: 0,
      cities: [],
    });
  });
});

describe('withRegistrationCounts', () => {
  it('deve contar os cadastros de cada cidade, ignorando acentos', () => {
    const rows = withRegistrationCounts(
      [
        {city: 'São Luís', group: null},
        {city: 'Caxias', group: null},
      ],
      [
        {
          id: 1,
          name: 'A',
          whatsapp: '1',
          email: 'a@x.com',
          city: 'São Luís',
          createdAt: '2026-09-01 10:00:00',
        },
        {
          id: 2,
          name: 'B',
          whatsapp: '2',
          email: 'b@x.com',
          city: 'sao luis',
          createdAt: '2026-09-01 10:00:00',
        },
      ],
    );
    expect(rows.map(row => row.registrations)).toEqual([2, 0]);
  });
});
