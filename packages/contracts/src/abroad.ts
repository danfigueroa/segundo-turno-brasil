import { CONTINENT_CODES, type AbroadCityResult, type CountryResult } from '@stb/domain';
import * as z from 'zod/mini';
import { roundSchema } from './results';

const count = z.int().check(z.nonnegative());
const timestamp = z.iso.datetime({ offset: true });
const ballots = z.object({ valid: count, blank: count, null: count });

export const countryResultSchema = z.object({
  name: z.string().check(z.minLength(1)),
  continent: z.enum(CONTINENT_CODES),
  votes: z.record(z.string(), count),
  sections: z.object({ total: count, counted: count }),
  electorate: count,
  turnout: count,
  ballots,
  updatedAt: timestamp,
}) satisfies z.ZodMiniType<CountryResult>;

export const abroadCityResultSchema = z.object({
  code: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  country: z.string().check(z.minLength(1)),
  continent: z.enum(CONTINENT_CODES),
  lat: z.number().check(z.gte(-90), z.lte(90)),
  lon: z.number().check(z.gte(-180), z.lte(180)),
  electorate: count,
  turnout: count,
  votes: z.record(z.string(), count),
  ballots,
  sections: z.object({ total: count, counted: count }),
  updatedAt: timestamp,
}) satisfies z.ZodMiniType<AbroadCityResult>;

/** Response of `GET /api/abroad?round=1|2`: votes abroad broken down by country and city. */
export const abroadResponseSchema = z.object({
  round: roundSchema,
  /** Every country with polling stations, in no particular order. */
  countries: z.readonly(z.array(countryResultSchema)),
  /** Every city with polling stations (the countries above add them up), for the world map. */
  cities: z.readonly(z.array(abroadCityResultSchema)),
  /** When our API fetched the data from the TSE. */
  fetchedAt: timestamp,
  /** True when the TSE was unreachable and an older breakdown is being served. */
  stale: z.boolean(),
});

export type AbroadResponse = z.infer<typeof abroadResponseSchema>;
