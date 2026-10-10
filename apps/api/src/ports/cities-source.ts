import type { MunicipalityResult, StateCode } from '@stb/domain';

/** Port: how every municipality of a state voted (TSE, fixtures, simulation…). */
export interface CitiesSource {
  fetchCities(uf: StateCode): Promise<readonly MunicipalityResult[]>;
}
