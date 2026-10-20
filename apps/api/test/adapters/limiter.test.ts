import { describe, expect, it } from 'vitest';
import { createLimiter } from '../../src/adapters/tse/limiter';

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

describe('createLimiter', () => {
  it('never runs more than the limit at once, and runs every task', async () => {
    const limit = createLimiter(3);
    let active = 0;
    let peak = 0;
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        limit(async () => {
          active += 1;
          peak = Math.max(peak, active);
          await tick();
          active -= 1;
          return index;
        }),
      ),
    );
    expect(peak).toBe(3);
    expect(results).toEqual(Array.from({ length: 20 }, (_, index) => index));
  });

  it('frees the slot of a failed task', async () => {
    const limit = createLimiter(1);
    await expect(limit(() => Promise.reject(new Error('down')))).rejects.toThrow('down');
    await expect(limit(async () => 'next')).resolves.toBe('next');
  });
});
