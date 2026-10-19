import { useI18n } from '../i18n/i18n-context';
import { Header } from './Header';
import styles from '../App.module.css';

/**
 * What shows until the first results arrive. Also rendered into `index.html` at build
 * time (`scripts/prerender-shell.ts`), so the page paints before the JavaScript runs.
 */
export function LoadingScreen() {
  const { m } = useI18n();
  return (
    <>
      <Header />
      <main className={styles.message} aria-busy="true">
        {m.site.loading}
      </main>
    </>
  );
}
