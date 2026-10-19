import type { AbroadResponse, ResultsResponse } from '@stb/contracts';
import { CONTINENT_CODES, countedPercentage, type ContinentCode } from '@stb/domain';
import { useState } from 'react';
import { useI18n } from '../../i18n/i18n-context';
import { countryRows, countryStandings, matchesSearch } from '../../lib/countries';
import type { Finalist } from '../../lib/finalists';
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

const FILTERS: readonly ContinentFilter[] = ['ALL', ...CONTINENT_CODES];

/**
 * Votes abroad by country, as in the design: summary, search, continent filter and one
 * row per country with the two finalists. Collapsed to the 12 (phone) or 20 (desktop)
 * countries with most votes. Each row selects its country.
 */
export function CountriesList({ data, abroad, failed, finalists, selection, onSelect }: Props) {
  const i18n = useI18n();
  const { m, f, country } = i18n;
  const { lists } = m;
  const wide = useMediaQuery('(min-width: 960px)');
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState<ContinentFilter>('ALL');
  const [expanded, setExpanded] = useState(false);

  const rows = abroad ? countryRows(abroad.countries, finalists) : [];
  const final = data.round === 1 || countedPercentage(data.abroad) >= 100;
  const summary = abroad
    ? abroadSummary(countryStandings(rows, finalists), finalists, data.abroad, final, i18n)
    : failed
      ? lists.countriesFailed
      : lists.countriesLoading;

  const filtered = rows.filter(
    (row) =>
      (continent === 'ALL' || row.continent === continent) &&
      // The TSE name too: "Japão" also finds Japan.
      (!query.trim() || matchesSearch(country(row.name), query) || matchesSearch(row.name, query)),
  );
  const limit = wide ? 20 : 12;
  const searching = query.trim() !== '';
  const shown = expanded || searching ? filtered : filtered.slice(0, limit);
  const [first, second] = finalists;
  const selected = countryOf(selection, abroad?.countries)?.name;

  return (
    <section className={`card ${styles.card}`} aria-labelledby="countries-title">
      <div className={styles.head}>
        <div className={styles.heading}>
          <h2 id="countries-title" className={styles.title}>
            {lists.byCountry}
          </h2>
          <p className={styles.summary}>{summary}</p>
        </div>
        <div className={styles.search}>
          <label htmlFor="country-search" className={styles.searchLabel}>
            {lists.searchCountry}
          </label>
          <input
            id="country-search"
            type="search"
            className={styles.searchInput}
            value={query}
            placeholder={lists.countryPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className={styles.filters} role="group" aria-label={lists.continent}>
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={styles.filter}
            aria-pressed={continent === filter}
            onClick={() => {
              setContinent(filter);
              setExpanded(false);
            }}
          >
            {filter === 'ALL' ? lists.all : m.places.continents[filter]}
          </button>
        ))}
      </div>

      <div className={styles.table}>
        <div className={styles.columns}>
          <span>{lists.countries(filtered.length)}</span>
          <span className={styles.wideOnly}>
            {first?.shortName} × {second?.shortName}
          </span>
          <span className={styles.wideOnly} data-hue={first?.hue}>
            {first?.shortName}
          </span>
          <span className={styles.wideOnly} data-hue={second?.hue}>
            {second?.shortName}
          </span>
          <span className={styles.totalHead}>{wide ? lists.totalWide : lists.total}</span>
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
                <span className={styles.name}>{country(row.name)}</span>
                <span className={styles.total}>
                  {wide ? f.votes(row.total) : m.common.votes(row.total, f.votes(row.total))}
                </span>
                <span className={styles.bar} aria-hidden="true">
                  {finalists.map((finalist, index) => (
                    <span
                      key={finalist.number}
                      className={styles.part}
                      data-hue={finalist.hue}
                      style={{ width: `${((row.votes[index] ?? 0) / row.total) * 100}%` }}
                    />
                  ))}
                </span>
                {finalists.map((finalist, index) => (
                  <span
                    key={finalist.number}
                    className={styles.votes}
                    data-hue={finalist.hue}
                    data-side={index === 0 ? 'first' : 'second'}
                    data-leader={row.leader === finalist.number || undefined}
                  >
                    <span className={styles.votesName}>{finalist.shortName}</span>{' '}
                    {f.votes(row.votes[index] ?? 0)}
                  </span>
                ))}
              </button>
            </li>
          ))}
        </ul>
        {abroad && filtered.length === 0 && <p className={styles.empty}>{lists.noCountry}</p>}
      </div>

      {!searching && filtered.length > limit && (
        <button
          type="button"
          className={styles.more}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? lists.showLess : lists.seeCountries(filtered.length)}
        </button>
      )}
    </section>
  );
}
