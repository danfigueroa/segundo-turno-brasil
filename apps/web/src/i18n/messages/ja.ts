import type { Messages } from './pt-BR';

/** Japanese. */
const messages: Messages = {
  places: {
    brazil: 'ブラジル',
    abroad: '海外',
    region: (name: string) => `${name}地方`,
    regions: { N: '北部', NE: '北東部', CO: '中西部', SE: '南東部', S: '南部' },
    continents: { AM: '南北アメリカ', EU: 'ヨーロッパ', AS: 'アジア・オセアニア', AF: 'アフリカ' },
  },
  units: { points: 'pt' },
};

export default messages;
