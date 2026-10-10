import type { MunicipalityResult } from '@stb/domain';
import * as z from 'zod/mini';
import { roundSchema, stateCodeSchema } from './results';

const count = z.int().check(z.nonnegative());
const timestamp = z.iso.datetime({ offset: true });

export const municipalityResultSchema = z.object({
  ibge: z.string().check(z.regex(/^\d{7}$/)),
  name: z.string().check(z.minLength(1)),
  electorate: count,
  turnout: count,
  votes: z.record(z.string(), count),
  ballots: z.object({ valid: count, blank: count, null: count }),
  sections: z.object({ total: count, counted: count }),
  updatedAt: timestamp,
}) satisfies z.ZodMiniType<MunicipalityResult>;

/** Response of `GET /api/cities?uf=xx&round=1|2`: every municipality of one state. */
export const citiesResponseSchema = z.object({
  round: roundSchema,
  uf: stateCodeSchema,
  /** Every municipality of the state, in no particular order. */
  cities: z.readonly(z.array(municipalityResultSchema)),
  /** When our API fetched the data from the TSE. */
  fetchedAt: timestamp,
  /** True when the TSE was unreachable and an older snapshot is being served. */
  stale: z.boolean(),
});

export type CitiesResponse = z.infer<typeof citiesResponseSchema>;
