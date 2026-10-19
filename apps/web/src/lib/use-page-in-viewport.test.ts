import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePageInViewport } from './use-page-in-viewport';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

function mockObserver() {
  const observers: { callback: Callback; disconnect: () => void }[] = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      readonly disconnect = vi.fn();
      readonly observe = vi.fn();
      constructor(callback: Callback) {
        observers.push({ callback, disconnect: this.disconnect });
      }
    },
  );
  return observers;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePageInViewport', () => {
  it('follows the observer when enabled', () => {
    const observers = mockObserver();
    const { result } = renderHook(() => usePageInViewport(true));
    expect(result.current).toBe(true);
    act(() => observers[0]?.callback([{ isIntersecting: false }]));
    expect(result.current).toBe(false);
    act(() => observers[0]?.callback([{ isIntersecting: true }]));
    expect(result.current).toBe(true);
  });

  it('stays true and observes nothing when disabled', () => {
    const observers = mockObserver();
    const { result } = renderHook(() => usePageInViewport(false));
    expect(result.current).toBe(true);
    expect(observers).toHaveLength(0);
  });

  it('disconnects on unmount', () => {
    const observers = mockObserver();
    const { unmount } = renderHook(() => usePageInViewport(true));
    unmount();
    expect(observers[0]?.disconnect).toHaveBeenCalled();
  });
});
