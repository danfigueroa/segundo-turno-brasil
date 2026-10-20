import { STATES, type StateCode } from '@stb/domain';
import { useDeferredValue, useMemo, useState } from 'react';
import { useI18n } from '../../i18n/i18n-context';
import { cityRows, cityWins, sortCityRows, type CityOrder } from '../../lib/cities';
import { matchesSearch } from '../../lib/countries';
import type { Finalist } from '../../lib/finalists';
import type { Municipalities, Selection } from '../../lib/selection';
import { useMediaQuery } from '../../lib/use-media-query';
import listStyles from '../countries/CountriesList.module.css';
import styles from './CitiesList.module.css';

interface Props {
  readonly uf: StateCode;
  readonly selection: Selection;
  readonly cities: Municipalities;
  readonly failed: boolean;
  readonly finalists: readonly Finalist[];
  readonly onSelect: (selection: Selection) => void;
}

const ORDERS: readonly CityOrder[] = ['electorate', 'margin', 'pending'];

/**
 * Every municipality of the selected state, like the list by country abroad: summary,
 * search, a ranking (biggest electorate, widest lead or most sections still to count) and
 * one row per city with the two finalists, collapsed to 12 (phone) or 20 (desktop) rows.
 * Each row selects its city.
 */
export function CitiesList({ uf, selection, cities, failed, finalists, onSelect }: Props) {
  const { m, f } = useI18n();
  const { lists } = m;
  const wide = useMediaQuery('(min-width: 960px)');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [order, setOrder] = useState<CityOrder>('electorate');

  // Hundreds of rows (853 in Minas Gerais): built and ranked once per poll and order, not
  // on every keystroke, and filtered with the query React can defer while typing.
  const rows = useMemo(() => (cities ? cityRows(cities, finalists) : []), [cities, finalists]);
  const wins = useMemo(() => cityWins(rows, finalists), [rows, finalists]);
  const anyLead = Object.values(wins).some((n) => n > 0);
  const summary = cities
    ? anyLead
      ? lists.outOfCities(
          finalists
            .map((finalist) =>
              lists.leadsIn(finalist.shortName, lists.cities(wins[finalist.number] ?? 0)),
            )
            .join(', '),
          lists.cities(rows.length),
        )
      : lists.citiesFill(lists.cities(rows.length))
    : failed
      ? lists.citiesFailed
      : lists.citiesLoading;

  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim() !== '';
  const ranked = useMemo(() => sortCityRows(rows, order), [rows, order]);
  const filtered = useMemo(
    () => (searching ? ranked.filter((row) => matchesSearch(row.name, deferredQuery)) : ranked),
    [ranked, searching, deferredQuery],
  );
  const limit = wide ? 20 : 12;
  const shown = expanded || searching ? filtered : filtered.slice(0, limit);
  const selectedIbge = selection.kind === 'city' ? selection.ibge : undefined;
  const [first, second] = finalists;

  return (
    <section className={`card ${listStyles.card}`} aria-labelledby="cities-title">
      <div className={listStyles.head}>
        <div className={listStyles.heading}>
          <h2 id="cities-title" className={listStyles.title}>
            {lists.byCity}
          </h2>
          <p className={listStyles.summary}>{summary}</p>
        </div>
        <div className={listStyles.search}>
          <label htmlFor="city-search" className={listStyles.searchLabel}>
            {lists.searchCity(STATES[uf].name)}
          </label>
          <input
            id="city-search"
            type="search"
            className={listStyles.searchInput}
            value={query}
            placeholder={lists.cityPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className={listStyles.filters} role="group" aria-label={lists.sortCities}>
        {ORDERS.map((option) => (
          <button
            key={option}
            type="button"
            className={listStyles.filter}
            aria-pressed={order === option}
            onClick={() => {
              setOrder(option);
              setExpanded(false);
            }}
          >
            {lists.orders[option]}
          </button>
        ))}
      </div>

      <div className={listStyles.table}>
        <div className={listStyles.columns}>
          <span>{lists.cities(filtered.length)}</span>
          <span className={listStyles.wideOnly}>
            {first?.shortName} × {second?.shortName}
          </span>
          <span className={listStyles.wideOnly} data-hue={first?.hue}>
            {first?.shortName}
          </span>
          <span className={listStyles.wideOnly} data-hue={second?.hue}>
            {second?.shortName}
          </span>
          <span className={listStyles.totalHead}>{wide ? lists.totalWide : lists.total}</span>
        </div>
        <ul className={listStyles.list}>
          {shown.map((row) => (
            <li key={row.ibge}>
              <button
                type="button"
                className={`${listStyles.row} ${styles.row}`}
                aria-current={row.ibge === selectedIbge ? 'location' : undefined}
                onClick={() => onSelect({ kind: 'city', state: uf, ibge: row.ibge })}
              >
                <span className={listStyles.name}>{row.name}</span>
                <span className={listStyles.total}>
                  {wide ? f.votes(row.total) : m.common.votes(row.total, f.votes(row.total))}
                </span>
                <span className={listStyles.bar} aria-hidden="true">
                  {row.total > 0 &&
                    finalists.map((finalist, index) => (
                      <span
                        key={finalist.number}
                        className={listStyles.part}
                        data-hue={finalist.hue}
                        style={{ width: `${((row.votes[index] ?? 0) / row.total) * 100}%` }}
                      />
                    ))}
                </span>
                {finalists.map((finalist, index) => (
                  <span
                    key={finalist.number}
                    className={listStyles.votes}
                    data-hue={finalist.hue}
                    data-side={index === 0 ? 'first' : 'second'}
                    data-leader={row.leader === finalist.number || undefined}
                  >
                    <span className={listStyles.votesName}>{finalist.shortName}</span>{' '}
                    {f.votes(row.votes[index] ?? 0)}
                  </span>
                ))}
              </button>
            </li>
          ))}
        </ul>
        {cities && filtered.length === 0 && <p className={listStyles.empty}>{lists.noCity}</p>}
      </div>

      {!searching && filtered.length > limit && (
        <button
          type="button"
          className={listStyles.more}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? lists.showLess : lists.seeCities(filtered.length)}
        </button>
      )}
    </section>
  );
}
