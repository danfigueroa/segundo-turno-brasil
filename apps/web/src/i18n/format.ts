const TIME_ZONE = 'America/Sao_Paulo';

/** Number and time formats of one language; times are always Brasília's, as the TSE's. */
export interface Format {
  /** `47.027` → `"47,03%"` (`"47.03%"` in English). */
  percent(value: number): string;
  /** Share of sections counted, rounded only when done: `87.4` → `"87,40%"`, `100` → `"100%"`. */
  counted(value: number): string;
  /** `56104503` → `"56.104.503"` (`"56,104,503"` in English). */
  votes(value: number): string;
  /** Lead in percentage points: `2.345` → `"+2,3"`, or `"+2,35"` with two decimals. */
  lead(value: number, decimals?: 1 | 2): string;
  /** Compact vote count: `1234567` → `"1,2 mi"`, `45600` → `"46 mil"`, `980` → `"980"`. */
  compactVotes(value: number): string;
  /** Percentage points: `2.5` → `"2,50 p.p."`. */
  points(value: number): string;
  /** Signed percentage points: `2.5` → `"+2,50 p.p."`, `-1` → `"−1,00 p.p."`. */
  pointsChange(value: number): string;
  /** ISO timestamp → Brasília date `"05/10"`. */
  date(iso: string): string;
  /** ISO timestamp → Brasília time `"19:42"`. */
  time(iso: string): string;
}

/** Words a language writes next to numbers. */
export interface Units {
  /** Percentage points, `"p.p."`. */
  readonly points: string;
}

/** `Intl` puts a no-break space in compact numbers; a plain one reads the same and wraps. */
const plainSpaces = (text: string) => text.replace(/\u00a0/g, ' ');

export function createFormat(locale: string, units: Units): Format {
  const percent = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const whole = new Intl.NumberFormat(locale, { style: 'percent' });
  const twoDecimals = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const oneDecimal = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const integer = new Intl.NumberFormat(locale);
  const millions = new Intl.NumberFormat(locale, {
    notation: 'compact',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const thousands = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 0,
  });
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  });
  const date = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    timeZone: TIME_ZONE,
  });

  return {
    percent: (value) => percent.format(value / 100),
    counted: (value) => (value >= 100 ? whole.format(1) : percent.format(value / 100)),
    votes: (value) => integer.format(Math.round(value)),
    lead: (value, decimals = 1) => `+${(decimals === 1 ? oneDecimal : twoDecimals).format(value)}`,
    compactVotes: (value) => {
      const abs = Math.abs(value);
      // Rounded first: `Intl` picks the unit from the raw value (999,600 would stay in thousands).
      if (abs >= 999_500) return plainSpaces(millions.format(Math.round(value / 1e5) * 1e5));
      if (abs >= 10_000) return plainSpaces(thousands.format(Math.round(value / 1e3) * 1e3));
      return integer.format(Math.round(value));
    },
    points: (value) => `${twoDecimals.format(value)} ${units.points}`,
    pointsChange: (value) => {
      const sign = value > 0.005 ? '+' : value < -0.005 ? '−' : '';
      return `${sign}${twoDecimals.format(Math.abs(value))} ${units.points}`;
    },
    date: (iso) => date.format(new Date(iso)),
    time: (iso) => time.format(new Date(iso)),
  };
}
