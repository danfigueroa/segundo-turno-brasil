import { lazy, Suspense, useState } from 'react';
import type { ShareContent } from './share-content';
import styles from './Share.module.css';

/** Loaded on demand: the canvas renderer is not needed until someone shares. */
const ShareDialog = lazy(() => import('./ShareDialog'));

interface Props {
  /** Built lazily, when the user taps, from the data on screen at that moment. */
  readonly getContent: () => ShareContent;
  /** `floating`: mobile FAB · `desktop`: desktop-only block · `inline`: always shown. */
  readonly variant: 'floating' | 'desktop' | 'inline';
  readonly hidden?: boolean;
}

export function ShareButton({ getContent, variant, hidden = false }: Props) {
  const [content, setContent] = useState<ShareContent>();

  return (
    <>
      <button
        type="button"
        className={styles.button}
        data-variant={variant}
        data-hidden={hidden || undefined}
        onClick={() => setContent(getContent())}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Compartilhar
      </button>
      {content && (
        <Suspense fallback={null}>
          <ShareDialog content={content} onClose={() => setContent(undefined)} />
        </Suspense>
      )}
    </>
  );
}
