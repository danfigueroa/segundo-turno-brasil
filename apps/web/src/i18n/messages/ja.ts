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
  common: {
    counted: (percent: string) => `開票率 ${percent}`,
    sectionsCounted: (percent: string) => `開票率 ${percent}`,
    noVotes: '開票前',
    votes: (_count: number, formatted: string) => `${formatted}票`,
    tie: '同数',
  },
  site: {
    name: 'Segundo Turno',
    subtitle: '2026年 大統領選挙',
    subtitleWide: ' · リアルタイム開票速報',
    title: 'Segundo Turno 2026 · 開票速報',
    loading: '結果を読み込み中…',
    error: '現在、結果を読み込めません。',
    retry: '再試行',
    credit: '開発:',
    follow: (host: string) => `${host} でライブ速報を見る`,
  },
  status: {
    live: 'ライブ',
    waiting: '開票待ち',
    finished: '開票終了',
    final: '最終結果',
    stale: (time: string) => `現在TSEが応答していません。${time}時点のデータを表示しています。`,
    finalAt: (date: string, time: string) => `最終結果(${date} ${time} 集計)`,
    updatedAt: (time: string) => `${time} 更新`,
    source: '(ブラジリア時間)· 出典:TSE',
  },
  units: { points: 'pt' },
};

export default messages;
