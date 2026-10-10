import type { AbroadResponse, ResultsResponse } from '@stb/contracts';
import {
  CONTINENT_CODES,
  CONTINENT_NAMES,
  countedPercentage,
  type ContinentCode,
} from '@stb/domain';
import { useState } from 'react';
import { countryRows, countryStandings, matchesSearch } from '../../lib/countries';
import type { Finalist } from '../../lib/finalists';
import { formatVotes } from '../../lib/format';
import { abroadCountry, countryOf, type Selection } from '../../lib/selection';
import { useMediaQuery } from '../../lib/use-media-query';
import rowStyles from '../cities/CitiesList.module.css';
import { abroadSummary } from './summary';
import styles from './CountriesList.module.css';

interface Props {
  readonly data: ResultsResponse;
  readonly abroad: AbroadResponse | undefined;
  readonly failed: boolean;
  readonly finalists: readonly Finalist[];
  /** Abroad, or the country selected in it. */
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

type ContinentFilter = ContinentCode | 'ALL';

const FILTERS: { value: ContinentFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  ...CONTINENT_CODES.map((code) => ({ value: code, label: CONTINENT_NAMES[code] })),
];

const votes = (n: number) => (n === 1 ? '1 voto' : `${formatVotes(n)} votos`);

/**
 * Votes abroad by country, as in the design: summary, search, continent filter and one
 * row per country with the two finalists. Collapsed to the 12 (phone) or 20 (desktop)
 * countries with most votes. Each row selects its country.
 */
export function CountriesList({ data, abroad, failed, finalists, selection, onSelect }: Props) {
  const wide = useMediaQuery('(min-width: 960px)');
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState<ContinentFilter>('ALL');
  const [expanded, setExpanded] = useState(false);

  const rows = abroad ? countryRows(abroad.countries, finalists) : [];
  const final = data.round === 1 || countedPercentage(data.abroad) >= 100;
  const summary = abroad
    ? abroadSummary(countryStandings(rows, finalists), finalists, data.abroad, final)
    : failed
      ? 'Não foi possível carregar a votação por país agora.'
      : 'Carregando a votação por país…';

  const filtered = rows.filter(
    (row) =>
      (continent === 'ALL' || row.continent === continent) &&
      (!query.trim() || matchesSearch(row.name, query)),
  );
  const limit = wide ? 20 : 12;
  const searching = query.trim() !== '';
  const shown = expanded || searching ? filtered : filtered.slice(0, limit);
  const [first, second] = finalists;
  const selected = countryOf(selection, abroad?.countries)?.name;
  const count = filtered.length === 1 ? '1 país' : `${filtered.length} países`;

  return (
    <section className={`card ${styles.card}`} aria-labelledby="countries-title">
      <div className={styles.head}>
        <div className={styles.heading}>
          <h2 id="countries-title" className={styles.title}>
            Votação por país
          </h2>
          <p className={styles.summary}>{summary}</p>
        </div>
        <div className={styles.search}>
          <label htmlFor="country-search" className={styles.searchLabel}>
            Buscar país
          </label>
          <input
            id="country-search"
            type="search"
            className={styles.searchInput}
            value={query}
            placeholder="Ex.: Portugal, Japão…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className={styles.filters} role="group" aria-label="Continente">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={styles.filter}
            aria-pressed={continent === filter.value}
            onClick={() => {
              setContinent(filter.value);
              setExpanded(false);
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className={styles.table}>
        <div className={styles.columns}>
          <span>{count}</span>
          <span className={styles.wideOnly}>
            {first?.shortName} × {second?.shortName}
          </span>
          <span className={styles.wideOnly} data-hue={first?.hue}>
            {first?.shortName}
          </span>
          <span className={styles.wideOnly} data-hue={second?.hue}>
            {second?.shortName}
          </span>
          <span className={styles.totalHead}>
            {wide ? 'Total (2 cand.)' : 'Votos nos 2 candidatos'}
          </span>
        </div>
        <ul className={styles.list}>
          {shown.map((row) => (
            <li key={row.name}>
              <button
                type="button"
                className={`${styles.row} ${rowStyles.row}`}
                aria-current={row.name === selected ? 'location' : undefined}
                onClick={() => onSelect(abroadCountry(row.name))}
              >
                <span className={styles.name}>{row.name}</span>
                <span className={styles.total}>
                  {wide ? formatVotes(row.total) : votes(row.total)}
                </span>
                <span className={styles.bar} aria-hidden="true">
                  {finalists.map((f, index) => (
                    <span
                      key={f.number}
                      className={styles.part}
                      data-hue={f.hue}
                      style={{ width: `${((row.votes[index] ?? 0) / row.total) * 100}%` }}
                    />
                  ))}
                </span>
                {finalists.map((f, index) => (
                  <span
                    key={f.number}
                    className={styles.votes}
                    data-hue={f.hue}
                    data-side={index === 0 ? 'first' : 'second'}
                    data-leader={row.leader === f.number || undefined}
                  >
                    <span className={styles.votesName}>{f.shortName}</span>{' '}
                    {formatVotes(row.votes[index] ?? 0)}
                  </span>
                ))}
              </button>
            </li>
          ))}
        </ul>
        {abroad && filtered.length === 0 && <p className={styles.empty}>Nenhum país encontrado.</p>}
      </div>

      {!searching && filtered.length > limit && (
        <button
          type="button"
          className={styles.more}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Mostrar menos' : `Ver todos os ${filtered.length} países`}
        </button>
      )}
    </section>
  );
}
