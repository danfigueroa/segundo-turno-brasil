import { lazy, Suspense, useState } from 'react';
import type { Selection } from '../../lib/selection';
import type { ShareContent } from './share-content';
import styles from './Share.module.css';

/** Loaded on demand: the canvas renderer is not needed until someone shares. */
const ShareDialog = lazy(() => import('./ShareDialog'));

interface Props {
  /**
   * Built when the user taps, from the data on screen at that moment; async so the code
   * that builds it loads on demand too.
   */
  readonly getContent: () => Promise<ShareContent>;
  readonly label: string;
  readonly selection: Selection;
}

export function ShareButton({ getContent, label, selection }: Props) {
  const [content, setContent] = useState<ShareContent>();

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => void getContent().then(setContent)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label}
      </button>
      {content && (
        <Suspense fallback={null}>
          <ShareDialog
            content={content}
            selection={selection}
            onClose={() => setContent(undefined)}
          />
        </Suspense>
      )}
    </>
  );
}
