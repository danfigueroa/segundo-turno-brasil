import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitUntil } from '../../src/http/wait-until';

const REQUEST_CONTEXT = Symbol.for('@vercel/request-context');

afterEach(() => {
  Reflect.deleteProperty(globalThis, REQUEST_CONTEXT);
});

describe('waitUntil', () => {
  it('hands the task to the Vercel request context', () => {
    const vercelWaitUntil = vi.fn();
    Reflect.set(globalThis, REQUEST_CONTEXT, { get: () => ({ waitUntil: vercelWaitUntil }) });
    const task = Promise.resolve();
    waitUntil(task);
    expect(vercelWaitUntil).toHaveBeenCalledWith(task);
  });

  it('does nothing off Vercel', () => {
    expect(() => waitUntil(Promise.resolve())).not.toThrow();
  });
});
