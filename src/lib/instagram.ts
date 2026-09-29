export const INSTAGRAM_USERNAME_REGEX =
  /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]{1,30}$/;

export const MAX_INSTAGRAM_INPUT_LENGTH = 200;

export const INSTAGRAM_PROFILE_URL_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+).*$/i;

export const INSTAGRAM_PROFILE_BASE = 'https://www.instagram.com/';

export const sanitizeInstagram = (value: string): string =>
  value.replace(/\s/g, '').replace(INSTAGRAM_PROFILE_URL_REGEX, '$1');

export const normalizeInstagram = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(INSTAGRAM_PROFILE_URL_REGEX, '$1')
    .replace(/^@/, '');

export const isValidInstagram = (value: string): boolean =>
  INSTAGRAM_USERNAME_REGEX.test(normalizeInstagram(value));

export const formatInstagram = (value: string): string =>
  value ? `@${normalizeInstagram(value)}` : '';

export const buildInstagramProfileLink = (value: string): string =>
  `${INSTAGRAM_PROFILE_BASE}${normalizeInstagram(value)}/`;
