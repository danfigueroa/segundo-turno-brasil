import type { I18n } from '../i18n/i18n';
import type { Locale } from '../i18n/locales';
import { LANG_PARAM } from '../i18n/resolve-locale';
import { selectionPath, type Selection } from './selection';
import { SITE_URL } from './site';

/** True on the embeddable view, `/?embed#/ba`: just the result card, for other sites. */
export function isEmbed(search: string = window.location.search): boolean {
  return new URLSearchParams(search).has('embed');
}

/** `lang=en` for a language other than pt-BR, so a shared link opens in it; `''` for pt-BR. */
function langParam(locale: Locale): string {
  return locale === 'pt-BR' ? '' : `${LANG_PARAM}=${locale}`;
}

/**
 * Link to the full site, on the production domain, at the same scope and round hash and
 * in the same language.
 */
export function fullSiteUrl(locale: Locale, hash: string = window.location.hash): string {
  const lang = langParam(locale);
  return `${SITE_URL}/${lang ? `?${lang}` : ''}${hash}`;
}

/** The `<iframe>` a blog or portal pastes to show the live result of a scope. */
export function embedCode(origin: string, selection: Selection, { locale, m }: I18n): string {
  const lang = langParam(locale);
  const src = `${origin}/?embed${lang ? `&${lang}` : ''}#/${selectionPath(selection)}`;
  return `<iframe src="${src}" title="${m.share.embedTitle}" width="100%" height="620" style="border:0;max-width:640px" loading="lazy"></iframe>`;
}
