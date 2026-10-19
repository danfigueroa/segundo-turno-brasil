import type { Messages } from './pt-BR';

/** Spanish. */
const messages: Messages = {
  places: {
    brazil: 'Brasil',
    abroad: 'Otros países',
    region: (name: string) => `Región ${name}`,
    regions: { N: 'Norte', NE: 'Nordeste', CO: 'Centro-Oeste', SE: 'Sudeste', S: 'Sur' },
    continents: { AM: 'Américas', EU: 'Europa', AS: 'Asia y Oceanía', AF: 'África' },
  },
  units: { points: 'p.p.' },
};

export default messages;
