export const EMAIL_REGEX =
  /^[a-z0-9]+(?:[._%+-][a-z0-9]+)*@[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*\.[a-z]{2,}$/;

export const MAX_EMAIL_LENGTH = 254;

export const MAX_EMAIL_LOCAL_LENGTH = 64;

export const sanitizeEmail = (value: string): string =>
  value.replace(/\s/g, '').slice(0, MAX_EMAIL_LENGTH);

export const normalizeEmail = (value: string): string =>
  value.trim().toLowerCase();

export const isValidEmail = (value: string): boolean => {
  const email = normalizeEmail(value);
  const [local] = email.split('@');
  return (
    email.length <= MAX_EMAIL_LENGTH &&
    local.length <= MAX_EMAIL_LOCAL_LENGTH &&
    EMAIL_REGEX.test(email)
  );
};
