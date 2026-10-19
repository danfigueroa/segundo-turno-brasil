import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from './locales';

const KEY = 'stb:locale';

/** The URL parameter that opens the site in a language: `?lang=en`. */
export const LANG_PARAM = 'lang';

/** A browser language tag as one of ours: `en-GB` → `en`, `pt-PT` → `pt-BR`. */
export function matchLocale(tag: string): Locale | undefined {
  if (isLocale(tag)) return tag;
  const language = tag.toLowerCase().split('-')[0];
  return LOCALES.find((locale) => locale.toLowerCase().split('-')[0] === language);
}

interface Sources {
  /** `location.search`. */
  readonly search: string;
  /** The language picked before, in this browser. */
  readonly stored: string | undefined;
  /** `navigator.languages`, most preferred first. */
  readonly languages: readonly string[];
}

/**
 * The language to open in: a `?lang=` link first (a shared link keeps its language), then
 * the one picked before, then the browser's, then pt-BR.
 */
export function resolveLocale({ search, stored, languages }: Sources): Locale {
  const param = new URLSearchParams(search).get(LANG_PARAM);
  for (const tag of [param, stored, ...languages]) {
    const locale = tag ? matchLocale(tag) : undefined;
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

/** The language picked before; `undefined` when none, or when storage is blocked. */
export function readStoredLocale(): string | undefined {
  try {
    return localStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Remembers the picked language. Silently does nothing without storage. */
export function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    // Private mode or blocked storage: the language just lasts for this visit.
  }
}
