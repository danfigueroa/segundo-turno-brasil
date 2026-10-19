import { createI18n, DEFAULT_I18N, type I18n } from './i18n';
import type { Locale } from './locales';
import type { Messages } from './messages/pt-BR';

/** Each translation is its own chunk, downloaded only by who picks it. */
const LOADERS: Readonly<Record<Exclude<Locale, 'pt-BR'>, () => Promise<{ default: Messages }>>> = {
  en: () => import('./messages/en'),
  es: () => import('./messages/es'),
  fr: () => import('./messages/fr'),
  it: () => import('./messages/it'),
  de: () => import('./messages/de'),
  ja: () => import('./messages/ja'),
};

/** The language's texts and formats; pt-BR is already in the bundle. */
export async function loadI18n(locale: Locale): Promise<I18n> {
  if (locale === 'pt-BR') return DEFAULT_I18N;
  const { default: messages } = await LOADERS[locale]();
  return createI18n(locale, messages);
}
