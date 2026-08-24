import municipalities from '@/data/municipios-ma.json';
import {MAX_CITY_SUGGESTIONS, filterCities, findCityByName} from '../cities';

const cities = municipalities as string[];

describe('filterCities', () => {
  it('deve buscar ignorando acentos e caixa', () => {
    expect(filterCities(cities, 'sao luis')).toContain('São Luís');
    expect(filterCities(cities, 'ACAI')).toContain('Açailândia');
  });

  it('deve priorizar cidades que começam com o termo', () => {
    const results = filterCities(cities, 'luis');
    expect(results[0]).toBe('Luís Domingues');
    expect(results).toContain('São Luís');
  });

  it('deve limitar a quantidade de sugestões', () => {
    expect(filterCities(cities, 'a').length).toBeLessThanOrEqual(
      MAX_CITY_SUGGESTIONS,
    );
    expect(filterCities(cities, '', 3)).toHaveLength(3);
  });

  it('deve retornar as primeiras cidades quando o termo é vazio', () => {
    expect(filterCities(cities, '  ')).toEqual(
      cities.slice(0, MAX_CITY_SUGGESTIONS),
    );
  });

  it('deve retornar vazio quando nada casa', () => {
    expect(filterCities(cities, 'gotham')).toEqual([]);
  });
});

describe('findCityByName', () => {
  it('deve encontrar cidade por nome exato ignorando acentos e caixa', () => {
    expect(findCityByName(cities, 'são luís')).toBe('São Luís');
    expect(findCityByName(cities, 'SAO LUIS')).toBe('São Luís');
    expect(findCityByName(cities, '  Imperatriz  ')).toBe('Imperatriz');
  });

  it('não deve aceitar nome parcial', () => {
    expect(findCityByName(cities, 'são')).toBe(null);
    expect(findCityByName(cities, 'luis')).toBe(null);
  });

  it('deve retornar null para vazio ou cidade inexistente', () => {
    expect(findCityByName(cities, '')).toBe(null);
    expect(findCityByName(cities, 'Gotham')).toBe(null);
  });
});
