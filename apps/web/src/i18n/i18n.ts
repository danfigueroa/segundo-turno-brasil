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
}

export function createI18n(locale: Locale, messages: Messages): I18n {
  return { locale, m: messages, f: createFormat(locale, messages.units) };
}

/** Brazilian Portuguese: the default, and what tests and the prerendered shell use. */
export const DEFAULT_I18N: I18n = createI18n(DEFAULT_LOCALE, ptBR);
