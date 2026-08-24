export const normalizeCpf = (value: string): string =>
  value.replace(/\D/g, '').slice(0, 11);

export const formatCpf = (value: string): string => {
  const digits = normalizeCpf(value);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
};

const calculateCheckDigit = (digits: string, length: number): number => {
  let sum = 0;
  for (let index = 0; index < length; index += 1) {
    sum += Number(digits[index]) * (length + 1 - index);
  }
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
};

export const isValidCpf = (value: string): boolean => {
  const digits = normalizeCpf(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }
  return (
    calculateCheckDigit(digits, 9) === Number(digits[9]) &&
    calculateCheckDigit(digits, 10) === Number(digits[10])
  );
};
