type SupportedLanguage = 'en' | 'fr';

const DEFAULT_LOCALE = 'en-CA';

export const getLocaleFromLanguage = (language?: string): string => {
  if (!language) return DEFAULT_LOCALE;

  const normalized = language.toLowerCase();
  const supportedLanguage = normalized.startsWith('fr') ? ('fr' as SupportedLanguage) : 'en';

  return supportedLanguage === 'fr' ? 'fr-CA' : 'en-CA';
};

export const formatDateLocalized = (
  value: string | number | Date,
  language?: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(getLocaleFromLanguage(language), options).format(date);
};

export const formatDateTimeLocalized = (
  value: string | number | Date,
  language?: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  return formatDateLocalized(value, language, options);
};

export const formatTimeLocalized = (
  value: string | Date,
  language?: string,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  const date =
    value instanceof Date
      ? value
      : (() => {
          const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
          if (!match) return new Date(value);

          const [, hoursRaw, minutesRaw, secondsRaw] = match;
          const hours = Number(hoursRaw);
          const minutes = Number(minutesRaw);
          const seconds = Number(secondsRaw ?? '0');

          const result = new Date();
          result.setHours(hours, minutes, seconds, 0);
          return result;
        })();

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(getLocaleFromLanguage(language), options).format(date);
};

export const formatCurrencyLocalized = (
  value: number,
  language?: string,
  currency = 'CAD'
): string => {
  return new Intl.NumberFormat(getLocaleFromLanguage(language), {
    style: 'currency',
    currency,
  }).format(value);
};
