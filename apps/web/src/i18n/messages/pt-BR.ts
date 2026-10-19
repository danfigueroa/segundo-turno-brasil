import type { ContinentCode, RegionCode } from '@stb/domain';
import type { Units } from '../format';

/**
 * Every text of the site in Brazilian Portuguese: the source the other languages
 * translate, key by key ({@link Messages}). Texts with numbers or names are functions.
 */
export const ptBR = {
  places: {
    brazil: 'Brasil',
    /** Votes cast abroad: clearer than "Exterior" for votes cast in other countries. */
    abroad: 'Outros países',
    /** A region as a scope: "Região Nordeste". */
    region: (name: string) => `Região ${name}`,
    regions: {
      N: 'Norte',
      NE: 'Nordeste',
      CO: 'Centro-Oeste',
      SE: 'Sudeste',
      S: 'Sul',
    } satisfies Record<RegionCode, string>,
    continents: {
      AM: 'Américas',
      EU: 'Europa',
      AS: 'Ásia e Oceania',
      AF: 'África',
    } satisfies Record<ContinentCode, string>,
  },
  units: { points: 'p.p.' } satisfies Units,
};

/** The shape every language's texts must have. */
export type Messages = typeof ptBR;
