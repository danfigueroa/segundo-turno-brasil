import { createContext, useContext } from 'react';
import { DEFAULT_I18N, type I18n } from './i18n';
import type { Locale } from './locales';

interface Value {
  readonly i18n: I18n;
  readonly setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<Value>({
  i18n: DEFAULT_I18N,
  setLocale: () => undefined,
});

/** The language on screen: its texts (`m`) and formats (`f`). pt-BR outside a provider. */
export function useI18n(): I18n {
  return useContext(I18nContext).i18n;
}

/** Switches the whole site to another language, and remembers it. */
export function useSetLocale(): (locale: Locale) => void {
  return useContext(I18nContext).setLocale;
}
