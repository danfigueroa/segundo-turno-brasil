import type { CountryResult } from '@stb/domain';

/** Port: votes abroad broken down by country (TSE, fixtures, simulation…). */
export interface AbroadSource {
  fetchCountries(): Promise<readonly CountryResult[]>;
}
