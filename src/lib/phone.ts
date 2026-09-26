export const PHONE_DIGITS_LENGTH = 11;

export const COUNTRY_CODE = '55';

export const MOBILE_PHONE_REGEX = /^[1-9][1-9]9\d{8}$/;

export const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const national =
    digits.startsWith(COUNTRY_CODE) && digits.length > PHONE_DIGITS_LENGTH
      ? digits.slice(COUNTRY_CODE.length)
      : digits;
  return national.slice(0, PHONE_DIGITS_LENGTH);
};

export const formatPhone = (value: string): string => {
  const digits = normalizePhone(value);
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/^\((\d{2})\) (\d{5})(\d)/, '($1) $2-$3');
};

export const isValidPhone = (value: string): boolean =>
  MOBILE_PHONE_REGEX.test(normalizePhone(value));

const WHATSAPP_CHAT_URL = 'https://wa.me/';

export const buildWhatsappChatLink = (value: string): string =>
  `${WHATSAPP_CHAT_URL}${COUNTRY_CODE}${normalizePhone(value)}`;
