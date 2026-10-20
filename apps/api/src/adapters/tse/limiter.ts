/** Runs a task once a slot is free. */
export type Limiter = <T>(task: () => Promise<T>) => Promise<T>;

/**
 * At most `max` tasks in flight, the rest queued in order. Shared by every TSE loader of
 * an instance, so several states refreshing at once never open hundreds of connections.
 */
export function createLimiter(max: number): Limiter {
  let active = 0;
  const waiting: (() => void)[] = [];
  // A finished task hands its slot straight to the next one in line.
  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active -= 1;
  };
  return async (task) => {
    if (active < max) active += 1;
    else await new Promise<void>((resolve) => waiting.push(resolve));
    try {
      return await task();
    } finally {
      release();
    }
  };
}
