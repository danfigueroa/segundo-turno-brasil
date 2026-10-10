/** The five official IBGE macro-regions of Brazil. */
export const REGION_CODES = ['N', 'NE', 'CO', 'SE', 'S'] as const;
export type RegionCode = (typeof REGION_CODES)[number];

export const REGION_NAMES: Readonly<Record<RegionCode, string>> = {
  N: 'Norte',
  NE: 'Nordeste',
  CO: 'Centro-Oeste',
  SE: 'Sudeste',
  S: 'Sul',
};

interface StateInfo {
  readonly name: string;
  readonly region: RegionCode;
  /** IBGE numeric code, used to join with map geometries. */
  readonly ibgeCode: string;
}

/** The 26 states plus the Federal District, keyed by their two-letter code. */
export const STATES = {
  AC: { name: 'Acre', region: 'N', ibgeCode: '12' },
  AL: { name: 'Alagoas', region: 'NE', ibgeCode: '27' },
  AM: { name: 'Amazonas', region: 'N', ibgeCode: '13' },
  AP: { name: 'Amapá', region: 'N', ibgeCode: '16' },
  BA: { name: 'Bahia', region: 'NE', ibgeCode: '29' },
  CE: { name: 'Ceará', region: 'NE', ibgeCode: '23' },
  DF: { name: 'Distrito Federal', region: 'CO', ibgeCode: '53' },
  ES: { name: 'Espírito Santo', region: 'SE', ibgeCode: '32' },
  GO: { name: 'Goiás', region: 'CO', ibgeCode: '52' },
  MA: { name: 'Maranhão', region: 'NE', ibgeCode: '21' },
  MG: { name: 'Minas Gerais', region: 'SE', ibgeCode: '31' },
  MS: { name: 'Mato Grosso do Sul', region: 'CO', ibgeCode: '50' },
  MT: { name: 'Mato Grosso', region: 'CO', ibgeCode: '51' },
  PA: { name: 'Pará', region: 'N', ibgeCode: '15' },
  PB: { name: 'Paraíba', region: 'NE', ibgeCode: '25' },
  PE: { name: 'Pernambuco', region: 'NE', ibgeCode: '26' },
  PI: { name: 'Piauí', region: 'NE', ibgeCode: '22' },
  PR: { name: 'Paraná', region: 'S', ibgeCode: '41' },
  RJ: { name: 'Rio de Janeiro', region: 'SE', ibgeCode: '33' },
  RN: { name: 'Rio Grande do Norte', region: 'NE', ibgeCode: '24' },
  RO: { name: 'Rondônia', region: 'N', ibgeCode: '11' },
  RR: { name: 'Roraima', region: 'N', ibgeCode: '14' },
  RS: { name: 'Rio Grande do Sul', region: 'S', ibgeCode: '43' },
  SC: { name: 'Santa Catarina', region: 'S', ibgeCode: '42' },
  SE: { name: 'Sergipe', region: 'NE', ibgeCode: '28' },
  SP: { name: 'São Paulo', region: 'SE', ibgeCode: '35' },
  TO: { name: 'Tocantins', region: 'N', ibgeCode: '17' },
} as const satisfies Record<string, StateInfo>;

export type StateCode = keyof typeof STATES;

export const STATE_CODES = Object.keys(STATES) as StateCode[];

export function isStateCode(value: string): value is StateCode {
  return Object.hasOwn(STATES, value);
}

export function statesInRegion(region: RegionCode): StateCode[] {
  return STATE_CODES.filter((code) => STATES[code].region === region);
}
