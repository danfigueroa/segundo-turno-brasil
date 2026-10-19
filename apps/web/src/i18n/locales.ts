/** Languages the site is translated to. pt-BR is the source of every text and the default. */
export const LOCALES = ['pt-BR', 'en', 'es', 'fr', 'it', 'de', 'ja'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt-BR';

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);
