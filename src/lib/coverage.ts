import {normalizeSearchText} from './text';
import type {
  Group,
  GroupCityRow,
  GroupCoverage,
  GroupCoverageCity,
  Registration,
} from './types';

const compareCities = (a: GroupCoverageCity, b: GroupCoverageCity): number =>
  a.city.localeCompare(b.city, 'pt-BR');

export const buildGroupCoverage = (
  municipalities: string[],
  groups: Group[],
): GroupCoverage => {
  const groupByCity = new Map(
    groups.map(group => [normalizeSearchText(group.city), group]),
  );
  const cities = municipalities
    .map(city => ({
      city,
      group: groupByCity.get(normalizeSearchText(city)) ?? null,
    }))
    .sort(compareCities);
  const covered = cities.filter(item => item.group).length;
  return {
    total: cities.length,
    covered,
    missing: cities.length - covered,
    ratio: cities.length === 0 ? 0 : covered / cities.length,
    cities,
  };
};

export const withRegistrationCounts = (
  cities: GroupCoverageCity[],
  registrations: Registration[],
): GroupCityRow[] => {
  const counts = new Map<string, number>();
  for (const registration of registrations) {
    const key = normalizeSearchText(registration.city);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return cities.map(item => ({
    ...item,
    registrations: counts.get(normalizeSearchText(item.city)) ?? 0,
  }));
};
