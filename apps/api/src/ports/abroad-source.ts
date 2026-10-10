import type { AbroadBreakdown } from '@stb/domain';

/** Port: votes abroad broken down by country and city (TSE, fixtures, simulation…). */
export interface AbroadSource {
  fetchAbroad(): Promise<AbroadBreakdown>;
}
