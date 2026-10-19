import { describe, expect, it } from 'vitest';
import { pluralizer } from './plural';

describe('pluralizer', () => {
  it('picks the form by the language rules', () => {
    const en = pluralizer('en');
    expect(en(1, { one: '# state', other: '# states' })).toBe('1 state');
    expect(en(1200, { one: '# state', other: '# states' })).toBe('1,200 states');
    // French counts zero as singular.
    expect(pluralizer('fr')(0, { one: '# pays', other: '# pays' })).toBe('0 pays');
    expect(pluralizer('fr')(0, { one: '# État', other: '# États' })).toBe('0 État');
  });

  it('falls back to the other form', () => {
    expect(pluralizer('ja')(1, { other: '#州' })).toBe('1州');
  });
});
