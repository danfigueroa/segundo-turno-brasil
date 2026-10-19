import type { Units } from '../format';

/**
 * Every text of the site in Brazilian Portuguese: the source the other languages
 * translate, key by key ({@link Messages}). Texts with numbers or names are functions.
 */
export const ptBR = {
  units: { points: 'p.p.' } satisfies Units,
};

/** The shape every language's texts must have. */
export type Messages = typeof ptBR;
