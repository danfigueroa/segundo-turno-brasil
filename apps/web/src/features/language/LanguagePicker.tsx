import { useEffect, useId, useRef, useState } from 'react';
import { useI18n, useSetLocale } from '../../i18n/i18n-context';
import { LOCALE_INFO, LOCALES } from '../../i18n/locales';
import { Flag } from './flags';
import styles from './LanguagePicker.module.css';

/**
 * The flag of the language on screen; a tap lists the others, each with its flag and its
 * own name. Closes on a pick, on Escape or on a tap anywhere else.
 */
export function LanguagePicker() {
  const { locale, m } = useI18n();
  const setLocale = useSetLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = LOCALE_INFO[locale];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    // The language on screen takes the focus, so arrows and Tab start from it.
    rootRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.picker}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={m.language.current(current.name)}
        onClick={() => setOpen((value) => !value)}
      >
        <Flag code={current.flag} className={styles.flag} />
        <span className={styles.code} aria-hidden="true">
          {current.code}
        </span>
      </button>
      {open && (
        <ul id={listId} className={styles.menu} aria-label={m.language.label}>
          {LOCALES.map((option) => {
            const info = LOCALE_INFO[option];
            return (
              <li key={option}>
                <button
                  type="button"
                  className={styles.option}
                  lang={option}
                  aria-current={option === locale}
                  onClick={() => {
                    setLocale(option);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                >
                  <Flag code={info.flag} className={styles.flag} />
                  {info.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
