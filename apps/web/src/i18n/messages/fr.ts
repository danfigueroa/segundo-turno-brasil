import type { Messages } from './pt-BR';

/** French. */
const messages: Messages = {
  places: {
    brazil: 'Brésil',
    abroad: 'Autres pays',
    region: (name: string) => `Région ${name}`,
    regions: { N: 'Nord', NE: 'Nord-Est', CO: 'Centre-Ouest', SE: 'Sud-Est', S: 'Sud' },
    continents: { AM: 'Amériques', EU: 'Europe', AS: 'Asie et Océanie', AF: 'Afrique' },
  },
  units: { points: 'pts' },
};

export default messages;
