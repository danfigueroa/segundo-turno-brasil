import { useEffect, useRef } from 'react';

interface Props {
  readonly value: number;
  readonly format: (value: number) => string;
  readonly className?: string | undefined;
}

const DURATION_MS = 800;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts from the previous value to the new one, writing straight to the DOM on each
 * animation frame (no React re-renders). A tiny tween instead of a motion library keeps
 * the initial bundle small.
 */
export function AnimatedNumber({ value, format, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    const node = ref.current;
    if (!node) return;
    if (from === value || prefersReducedMotion()) {
      node.textContent = format(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      node.textContent = format(from + (value - from) * easeOutCubic(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, format]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
