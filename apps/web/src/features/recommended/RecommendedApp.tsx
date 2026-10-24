import { useI18n } from '../../i18n/i18n-context';
import styles from './RecommendedApp.module.css';

/** A friend's app, a name the same in every language. */
const APP = { name: 'WeRacha', url: 'https://weracha.app' } as const;

/** A card at the end of the page recommending {@link APP}. */
export function RecommendedApp() {
  const { m } = useI18n();
  return (
    <aside className={`card ${styles.card}`} aria-labelledby="recommended-title">
      <div className={styles.heading}>
        <div className={styles.eyebrow}>{m.recommended.label}</div>
        <h2 id="recommended-title" className={styles.title}>
          {APP.name}
        </h2>
        <p className={styles.text}>{m.recommended.text}</p>
      </div>
      <a className={styles.link} href={APP.url} target="_blank" rel="noopener">
        {m.recommended.cta(APP.name)}
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </a>
    </aside>
  );
}
