const percent = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const integer = new Intl.NumberFormat('pt-BR');
const time = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/** `47.027` → `"47,03%"`. */
export function formatPercent(value: number): string {
  return `${percent.format(value)}%`;
}

/** `56104503` → `"56.104.503"`. */
export function formatVotes(value: number): string {
  return integer.format(Math.round(value));
}

/** Percentage points: `2.5` → `"2,50 p.p."`. */
export function formatPoints(value: number): string {
  return `${percent.format(value)} p.p.`;
}

/** ISO timestamp → Brasília time `"19:42"`. */
export function formatTime(iso: string): string {
  return time.format(new Date(iso));
}

const LOWERCASE_WORDS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

/** TSE names come in uppercase: `"FLAVIO BOLSONARO"` → `"Flavio Bolsonaro"`. */
export function formatName(name: string): string {
  return name
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((word, index) =>
      index > 0 && LOWERCASE_WORDS.has(word)
        ? word
        : word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1),
    )
    .join(' ');
}
