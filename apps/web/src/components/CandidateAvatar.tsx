import { useState } from 'react';
import type { Finalist } from '../lib/finalists';
import styles from './CandidateAvatar.module.css';

interface Props {
  readonly finalist: Finalist;
  /** Size, color and font come from the caller; the photo fills the circle. */
  readonly className?: string | undefined;
}

/**
 * Official TSE ballot photo (served from `public/candidates`, see
 * `scripts/fetch-candidate-photos.ts`) inside a ring of the candidate's color. Falls back
 * to the initials when there is no photo for that ballot number.
 */
export function CandidateAvatar({ finalist, className }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`${styles.avatar} ${className ?? ''}`} aria-hidden="true">
      {failed ? (
        finalist.initials
      ) : (
        <img
          className={styles.photo}
          src={`/candidates/${finalist.number}.jpeg`}
          alt=""
          width={52}
          height={52}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
