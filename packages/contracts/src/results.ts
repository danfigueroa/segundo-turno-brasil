import { REGION_CODES, STATE_CODES, type Tally } from '@stb/domain';
import { z } from 'zod';

const count = z.number().int().nonnegative();
const timestamp = z.iso.datetime({ offset: true });

export const stateCodeSchema = z.enum(STATE_CODES);

export const scopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('country') }),
  z.object({ kind: z.literal('region'), code: z.enum(REGION_CODES) }),
  z.object({ kind: z.literal('state'), code: stateCodeSchema }),
  z.object({ kind: z.literal('abroad') }),
]);

export const candidateResultSchema = z.object({
  number: z.string().min(1),
  name: z.string().min(1),
  party: z.string(),
  votes: count,
  share: z.number().min(0).max(100),
});

export const tallySchema = z.object({
  scope: scopeSchema,
  candidates: z.array(candidateResultSchema).readonly(),
  sections: z.object({ total: count, counted: count }),
  electorate: count,
  turnout: count,
  votes: z.object({ valid: count, blank: count, null: count }),
  updatedAt: timestamp,
}) satisfies z.ZodType<Tally>;

/** Response of `GET /api/results`: a consistent snapshot of every scope. */
export const resultsResponseSchema = z.object({
  country: tallySchema,
  /** Every one of the 27 federative units. */
  states: z.record(stateCodeSchema, tallySchema),
  abroad: tallySchema,
  /** When our API fetched the data from the TSE. */
  fetchedAt: timestamp,
  /** True when the TSE was unreachable and an older snapshot is being served. */
  stale: z.boolean(),
});

export type ResultsResponse = z.infer<typeof resultsResponseSchema>;
