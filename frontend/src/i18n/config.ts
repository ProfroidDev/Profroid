import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en/translations.json';
import frTranslations from '../locales/fr/translations.json';

const LANGUAGE_KEY = 'i18nextLng';

// HARDCODED PROTECTION: Only allow explicit user-initiated language changes
let allowLanguageChange = false;

// Get language from localStorage only - NEVER read from browser detection or backend
const getInitialLanguage = (): 'en' | 'fr' => {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'fr') {
      return saved;
    }
  } catch {
    // localStorage might be inaccessible
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  defaultNS: 'translation',
  ns: ['translation'],
  resources: {
    en: {
      translation: enTranslations,
    },
    fr: {
      translation: frTranslations,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

// CRITICAL: Override changeLanguage to prevent unauthorized language changes
const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = function (lng: string | undefined) {
  if (!allowLanguageChange) {
    console.warn('[i18n PROTECTION] Blocked unauthorized changeLanguage call with:', lng);
    return Promise.resolve();
  }

  if (lng && (lng === 'en' || lng === 'fr')) {
    try {
      localStorage.setItem(LANGUAGE_KEY, lng);
    } catch {
      // localStorage might be inaccessible
    }
  }
  return originalChangeLanguage(lng);
} as any;

// ONLY way to change language: via explicit user action (language switcher button)
export const changeLanguageExplicitly = (lng: 'en' | 'fr') => {
  allowLanguageChange = true;
  i18n.changeLanguage(lng);
  allowLanguageChange = false;
};

export default i18n;
