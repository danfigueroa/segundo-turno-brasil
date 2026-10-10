import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// jest-dom 7 augments vitest's `Assertion`, whose signature changed in vitest 5;
// `Matchers` is the extension point vitest documents for custom matchers.
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Matchers<T = any> extends TestingLibraryMatchers<unknown, T> {}
}
