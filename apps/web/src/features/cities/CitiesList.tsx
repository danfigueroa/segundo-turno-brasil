import { STATES, type StateCode } from '@stb/domain';
import { useState } from 'react';
import { cityRows, cityWins, sortCityRows, type CityOrder } from '../../lib/cities';
import { matchesSearch } from '../../lib/countries';
import type { Finalist } from '../../lib/finalists';
import { formatVotes } from '../../lib/format';
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

const votes = (n: number) => (n === 1 ? '1 voto' : `${formatVotes(n)} votos`);
const citiesText = (n: number) => (n === 1 ? '1 cidade' : `${n} cidades`);

const ORDERS: { value: CityOrder; label: string }[] = [
  { value: 'electorate', label: 'Maior eleitorado' },
  { value: 'margin', label: 'Maior vantagem' },
  { value: 'pending', label: 'Mais urnas a apurar' },
];

/**
 * Every municipality of the selected state, like the list by country abroad: summary,
 * search, a ranking (biggest electorate, widest lead or most sections still to count) and
 * one row per city with the two finalists, collapsed to 12 (phone) or 20 (desktop) rows.
 * Each row selects its city.
 */
export function CitiesList({ uf, selection, cities, failed, finalists, onSelect }: Props) {
  const wide = useMediaQuery('(min-width: 960px)');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [order, setOrder] = useState<CityOrder>('electorate');

  const rows = cities ? cityRows(cities, finalists) : [];
  const wins = cityWins(rows, finalists);
  const anyLead = Object.values(wins).some((n) => n > 0);
  const summary = cities
    ? anyLead
      ? `${finalists.map((f) => `${f.shortName} lidera em ${citiesText(wins[f.number] ?? 0)}`).join(', ')}, de ${citiesText(rows.length)}.`
      : `${citiesText(rows.length)}. Elas ganham cor conforme as urnas são apuradas.`
    : failed
      ? 'Não foi possível carregar a votação por cidade agora.'
      : 'Carregando a votação por cidade…';

  const searching = query.trim() !== '';
  const ranked = sortCityRows(rows, order);
  const filtered = searching ? ranked.filter((row) => matchesSearch(row.name, query)) : ranked;
  const limit = wide ? 20 : 12;
  const shown = expanded || searching ? filtered : filtered.slice(0, limit);
  const selectedIbge = selection.kind === 'city' ? selection.ibge : undefined;
  const [first, second] = finalists;

  return (
    <section className={`card ${listStyles.card}`} aria-labelledby="cities-title">
      <div className={listStyles.head}>
        <div className={listStyles.heading}>
          <h2 id="cities-title" className={listStyles.title}>
            Votação por cidade
          </h2>
          <p className={listStyles.summary}>{summary}</p>
        </div>
        <div className={listStyles.search}>
          <label htmlFor="city-search" className={listStyles.searchLabel}>
            Buscar cidade em {STATES[uf].name}
          </label>
          <input
            id="city-search"
            type="search"
            className={listStyles.searchInput}
            value={query}
            placeholder="Ex.: nome da cidade"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className={listStyles.filters} role="group" aria-label="Ordenar cidades por">
        {ORDERS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={listStyles.filter}
            aria-pressed={order === option.value}
            onClick={() => {
              setOrder(option.value);
              setExpanded(false);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={listStyles.table}>
        <div className={listStyles.columns}>
          <span>{citiesText(filtered.length)}</span>
          <span className={listStyles.wideOnly}>
            {first?.shortName} × {second?.shortName}
          </span>
          <span className={listStyles.wideOnly} data-hue={first?.hue}>
            {first?.shortName}
          </span>
          <span className={listStyles.wideOnly} data-hue={second?.hue}>
            {second?.shortName}
          </span>
          <span className={listStyles.totalHead}>
            {wide ? 'Total (2 cand.)' : 'Votos nos 2 candidatos'}
          </span>
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
                  {wide ? formatVotes(row.total) : votes(row.total)}
                </span>
                <span className={listStyles.bar} aria-hidden="true">
                  {row.total > 0 &&
                    finalists.map((f, index) => (
                      <span
                        key={f.number}
                        className={listStyles.part}
                        data-hue={f.hue}
                        style={{ width: `${((row.votes[index] ?? 0) / row.total) * 100}%` }}
                      />
                    ))}
                </span>
                {finalists.map((f, index) => (
                  <span
                    key={f.number}
                    className={listStyles.votes}
                    data-hue={f.hue}
                    data-side={index === 0 ? 'first' : 'second'}
                    data-leader={row.leader === f.number || undefined}
                  >
                    <span className={listStyles.votesName}>{f.shortName}</span>{' '}
                    {formatVotes(row.votes[index] ?? 0)}
                  </span>
                ))}
              </button>
            </li>
          ))}
        </ul>
        {cities && filtered.length === 0 && (
          <p className={listStyles.empty}>Nenhuma cidade encontrada.</p>
        )}
      </div>

      {!searching && filtered.length > limit && (
        <button
          type="button"
          className={listStyles.more}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Mostrar menos' : `Ver todas as ${filtered.length} cidades`}
        </button>
      )}
    </section>
  );
}
