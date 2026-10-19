/** Languages the site is translated to. pt-BR is the source of every text and the default. */
export const LOCALES = ['pt-BR', 'en', 'es', 'fr', 'it', 'de', 'ja'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt-BR';

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/** Flags drawn by the language picker (`features/language/flags.tsx`). */
export type FlagCode = 'BR' | 'US' | 'ES' | 'FR' | 'IT' | 'DE' | 'JP';

export interface LocaleInfo {
  /** The language's own name, as its readers look for it: "Deutsch", "日本語". */
  readonly name: string;
  /** Short code on the picker button: "EN". */
  readonly code: string;
  readonly flag: FlagCode;
}

export const LOCALE_INFO: Readonly<Record<Locale, LocaleInfo>> = {
  'pt-BR': { name: 'Português', code: 'PT', flag: 'BR' },
  en: { name: 'English', code: 'EN', flag: 'US' },
  es: { name: 'Español', code: 'ES', flag: 'ES' },
  fr: { name: 'Français', code: 'FR', flag: 'FR' },
  it: { name: 'Italiano', code: 'IT', flag: 'IT' },
  de: { name: 'Deutsch', code: 'DE', flag: 'DE' },
  ja: { name: '日本語', code: 'JA', flag: 'JP' },
};
