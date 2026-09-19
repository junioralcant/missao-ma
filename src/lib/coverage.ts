import {normalizeSearchText} from './text';
import type {Group, GroupCoverage, GroupCoverageCity} from './types';

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
