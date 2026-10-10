import { useEffect, useRef, useState } from 'react';
import { interpolateViewBox, sameViewBox, type ViewBox } from './viewport';

const DURATION_MS = 600;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Glides the map from the current view to `target` on animation frames (a jump when the
 * user prefers reduced motion). A change mid-flight starts from where the map is.
 */
export function useTweenedViewBox(target: ViewBox): ViewBox {
  const [view, setView] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (sameViewBox(from, target)) return;

    const duration = prefersReducedMotion() ? 0 : DURATION_MS;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = duration ? Math.min((now - start) / duration, 1) : 1;
      current.current = interpolateViewBox(from, target, easeInOutCubic(progress));
      setView(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return view;
}
