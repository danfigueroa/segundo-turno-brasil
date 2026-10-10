import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface Props {
  readonly value: number;
  readonly format: (value: number) => string;
  readonly className?: string | undefined;
}

/** Counts from the previous value to the new one, updating the DOM without re-rendering. */
export function AnimatedNumber({ value, format, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduceMotion || from === value) {
      if (ref.current) ref.current.textContent = format(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = format(latest);
      },
    });
    return () => controls.stop();
  }, [value, format, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
