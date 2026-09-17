export const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export const MAX_EMAIL_LENGTH = 254;

export const normalizeEmail = (value: string): string =>
  value.trim().toLowerCase();

export const isValidEmail = (value: string): boolean => {
  const email = normalizeEmail(value);
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(email);
};
