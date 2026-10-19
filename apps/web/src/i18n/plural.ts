/** The forms of a word by count; `#` is replaced by the formatted count. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  readonly other: string;
};

/**
 * Picks the plural form of a count with the language's rules (`Intl.PluralRules`):
 * `plural(3, { one: '# state', other: '# states' })` → `"3 states"`.
 */
export function pluralizer(locale: string): (count: number, forms: PluralForms) => string {
  const rules = new Intl.PluralRules(locale);
  const number = new Intl.NumberFormat(locale);
  return (count, forms) =>
    (forms[rules.select(count)] ?? forms.other).replaceAll('#', number.format(count));
}
