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
  units: { points: 'pts' },
};

export default messages;
