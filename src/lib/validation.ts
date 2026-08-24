import municipalities from '@/data/municipios-ma.json';

export const WHATSAPP_INVITE_CODE_REGEX = /^[A-Za-z0-9]+$/;

export const WHATSAPP_LINK_BASE = 'https://chat.whatsapp.com';

export const MIN_NAME_LENGTH = 3;

export const isMaranhaoMunicipality = (city: string): boolean =>
  (municipalities as string[]).includes(city);

export const normalizeWhatsappLink = (link: string): string | null => {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'chat.whatsapp.com') {
    return null;
  }
  const inviteCode = url.pathname.replace(/\/$/, '').slice(1);
  if (!WHATSAPP_INVITE_CODE_REGEX.test(inviteCode)) {
    return null;
  }
  return `${WHATSAPP_LINK_BASE}/${inviteCode}`;
};
