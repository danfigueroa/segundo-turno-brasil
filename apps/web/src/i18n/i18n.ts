import { COUNTRY_CODES } from '../lib/country-codes';
import { createFormat, type Format } from './format';
import { DEFAULT_LOCALE, type Locale } from './locales';
import { ptBR, type Messages } from './messages/pt-BR';

/** Everything a screen needs to speak one language. */
export interface I18n {
  readonly locale: Locale;
  /** The texts. */
  readonly m: Messages;
  /** Numbers and times. */
  readonly f: Format;
  /** A country abroad, by its TSE name, in this language: "Estados Unidos" → "United States". */
  readonly country: (name: string) => string;
}

function countryNames(locale: Locale): (name: string) => string {
  // TSE names are already Portuguese, and Brazilian ("Holanda", not "Países Baixos").
  if (locale === 'pt-BR') return (name) => name;
  const names = new Intl.DisplayNames(locale, { type: 'region', fallback: 'none' });
  return (name) => {
    const code = COUNTRY_CODES[name];
    return (code && names.of(code)) || name;
  };
}

export function createI18n(locale: Locale, messages: Messages): I18n {
  return {
    locale,
    m: messages,
    f: createFormat(locale, messages.units),
    country: countryNames(locale),
  };
}

/** Brazilian Portuguese: the default, and what tests and the prerendered shell use. */
export const DEFAULT_I18N: I18n = createI18n(DEFAULT_LOCALE, ptBR);
