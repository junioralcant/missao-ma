import {normalizeSearchText} from './text';

export const MAX_CITY_SUGGESTIONS = 8;

export const filterCities = (
  cities: string[],
  query: string,
  limit: number = MAX_CITY_SUGGESTIONS,
): string[] => {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) {
    return cities.slice(0, limit);
  }
  const startsWith: string[] = [];
  const contains: string[] = [];
  for (const city of cities) {
    const normalizedCity = normalizeSearchText(city);
    if (normalizedCity.startsWith(normalizedQuery)) {
      startsWith.push(city);
    } else if (normalizedCity.includes(normalizedQuery)) {
      contains.push(city);
    }
  }
  return [...startsWith, ...contains].slice(0, limit);
};

export const findCityByName = (
  cities: string[],
  query: string,
): string | null => {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) {
    return null;
  }
  return (
    cities.find(city => normalizeSearchText(city) === normalizedQuery) ?? null
  );
};
