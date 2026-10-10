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

const oneDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Compact lead in percentage points: `2.34` → `"+2,3"`. */
export function formatLead(value: number): string {
  return `+${oneDecimal.format(value)}`;
}

/** Percentage points: `2.5` → `"2,50 p.p."`. */
export function formatPoints(value: number): string {
  return `${percent.format(value)} p.p.`;
}

const date = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/** ISO timestamp → Brasília date `"05/10"`. */
export function formatDate(iso: string): string {
  return date.format(new Date(iso));
}

/** ISO timestamp → Brasília time `"19:42"`. */
export function formatTime(iso: string): string {
  return time.format(new Date(iso));
}

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
