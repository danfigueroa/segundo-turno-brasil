import { Header } from './Header';
import styles from '../App.module.css';

/**
 * What shows until the first results arrive. Also rendered into `index.html` at build
 * time (`scripts/prerender-shell.ts`), so the page paints before the JavaScript runs.
 */
export function LoadingScreen() {
  return (
    <>
      <Header />
      <main className={styles.message} aria-busy="true">
        Carregando resultados…
      </main>
    </>
  );
}
