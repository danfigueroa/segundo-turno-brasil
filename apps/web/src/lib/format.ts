const LOWERCASE_WORDS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

/** Ballot names the TSE publishes without their accents. */
const ACCENTED: Readonly<Record<string, string>> = { flavio: 'flávio' };

/** TSE names come in uppercase and unaccented: `"FLAVIO BOLSONARO"` → `"Flávio Bolsonaro"`. */
export function formatName(name: string): string {
  return name
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((word) => ACCENTED[word] ?? word)
    .map((word, index) =>
      index > 0 && LOWERCASE_WORDS.has(word)
        ? word
        : word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1),
    )
    .join(' ');
}

/** Up to two initials for an avatar: `"Flávio Bolsonaro"` → `"FB"`, `"Lula"` → `"L"`. */
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter((word) => word && !LOWERCASE_WORDS.has(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase('pt-BR'))
    .join('');
}
