import { CONTINENT_CODES, type CountryResult } from '@stb/domain';
import * as z from 'zod/mini';
import { roundSchema } from './results';

const count = z.int().check(z.nonnegative());
const timestamp = z.iso.datetime({ offset: true });

export const countryResultSchema = z.object({
  name: z.string().check(z.minLength(1)),
  continent: z.enum(CONTINENT_CODES),
  votes: z.record(z.string(), count),
  sections: z.object({ total: count, counted: count }),
}) satisfies z.ZodMiniType<CountryResult>;

/** Response of `GET /api/abroad?round=1|2`: votes abroad broken down by country. */
export const abroadResponseSchema = z.object({
  round: roundSchema,
  /** Every country with polling stations, in no particular order. */
  countries: z.readonly(z.array(countryResultSchema)),
  /** When our API fetched the data from the TSE. */
  fetchedAt: timestamp,
  /** True when the TSE was unreachable and an older breakdown is being served. */
  stale: z.boolean(),
});

export type AbroadResponse = z.infer<typeof abroadResponseSchema>;
