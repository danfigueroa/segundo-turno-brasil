import { useEffect, useState } from 'react';

/**
 * Whether the page is inside the viewport of the top-level page. In an iframe, the
 * implicit root of an `IntersectionObserver` is that viewport, so an embed scrolled out of
 * view reads `false`. Always `true` when `enabled` is false or the observer is missing.
 */
export function usePageInViewport(enabled: boolean): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      if (entry) setInView(entry.isIntersecting);
    });
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [enabled]);
  return !enabled || inView;
}
