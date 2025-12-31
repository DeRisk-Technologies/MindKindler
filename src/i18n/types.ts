// src/i18n/types.ts

export type LocaleCode = string;

export interface LocaleConfig {
  code: LocaleCode;
  label: string;
  dir: 'ltr' | 'rtl';
}

export interface Translations {
  [key: string]: string | Translations;
}

export interface I18nContextProps {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: LocaleConfig[];
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'en-GB', label: 'English (UK)', dir: 'ltr' },
  { code: 'fr-FR', label: 'Français', dir: 'ltr' },
  { code: 'es-ES', label: 'Español', dir: 'ltr' },
];

export const DEFAULT_LOCALE = 'en-GB';
