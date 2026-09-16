const LOCALE = 'pt-BR';

const PERCENT_FRACTION_DIGITS = 2;

const FULL_BAR = 1;

export const formatNumber = (value: number): string =>
  value.toLocaleString(LOCALE);

export const formatRatio = (value: number): string =>
  `${(value * 100).toLocaleString(LOCALE, {
    minimumFractionDigits: PERCENT_FRACTION_DIGITS,
    maximumFractionDigits: PERCENT_FRACTION_DIGITS,
  })}%`;

export const formatPercent = (value: number): string =>
  Number.isFinite(value) ? `${Math.min(value, FULL_BAR) * 100}%` : '0%';
