import type { Messages } from './pt-BR';

/** English. */
const messages: Messages = {
  places: {
    brazil: 'Brazil',
    abroad: 'Other countries',
    region: (name: string) => `${name} region`,
    regions: { N: 'North', NE: 'Northeast', CO: 'Center-West', SE: 'Southeast', S: 'South' },
    continents: { AM: 'Americas', EU: 'Europe', AS: 'Asia and Oceania', AF: 'Africa' },
  },
  common: {
    counted: (percent: string) => `${percent} counted`,
    sectionsCounted: (percent: string) => `${percent} of polling stations counted`,
    noVotes: 'No votes counted',
    votes: (count: number, formatted: string) =>
      count === 1 ? `${formatted} vote` : `${formatted} votes`,
    tie: 'tie',
  },
  site: {
    name: 'Segundo Turno',
    subtitle: '2026 presidential election',
    subtitleWide: ' · live vote count',
    title: 'Segundo Turno 2026 · Live vote count',
    loading: 'Loading results…',
    error: 'The results could not be loaded right now.',
    retry: 'Try again',
    credit: 'Made by',
    follow: (host: string) => `Follow it live at ${host}`,
  },
  status: {
    live: 'Live',
    waiting: 'Waiting',
    finished: 'Count finished',
    final: 'Final result',
    stale: (time: string) => `The TSE is not responding right now. Showing the data from ${time}.`,
    finalAt: (date: string, time: string) => `Final result, totaled on ${date} at ${time}`,
    updatedAt: (time: string) => `Updated at ${time}`,
    source: '(Brasília time) · Source: TSE',
  },
  units: { points: 'pts' },
};

export default messages;
