import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { I18nContext } from './i18n-context';
import type { I18n } from './i18n';
import { loadI18n } from './load';
import type { Locale } from './locales';
import { LANG_PARAM, writeStoredLocale } from './resolve-locale';

interface Props {
  /** The language resolved (and loaded) before the first render. */
  readonly initial: I18n;
  readonly children: ReactNode;
}

/** Keeps the `?lang=` of the address in step with the language on screen, if it has one. */
function syncLangParam(locale: Locale) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(LANG_PARAM)) return;
  url.searchParams.set(LANG_PARAM, locale);
  window.history.replaceState(window.history.state, '', url);
}

export function I18nProvider({ initial, children }: Props) {
  const [i18n, setI18n] = useState(initial);
  // The last language picked: a slower download of an earlier pick must not win.
  const picked = useRef(initial.locale);

  useEffect(() => {
    document.documentElement.lang = i18n.locale;
  }, [i18n.locale]);

  const setLocale = useCallback((locale: Locale) => {
    picked.current = locale;
    writeStoredLocale(locale);
    syncLangParam(locale);
    loadI18n(locale).then(
      (next) => {
        if (picked.current === next.locale) setI18n(next);
      },
      () => {
        // Offline: the chunk did not download, so the site stays in the current language.
      },
    );
  }, []);

  const value = useMemo(() => ({ i18n, setLocale }), [i18n, setLocale]);
  return <I18nContext value={value}>{children}</I18nContext>;
}
