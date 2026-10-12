import { REGION_CODES, STATE_CODES, type Round, type Tally } from '@stb/domain';
// zod/mini is tree-shakeable: this module also ships to the browser, where classic zod
// would add ~90 KB (gzip) to the bundle.
import * as z from 'zod/mini';

const count = z.int().check(z.nonnegative());
const timestamp = z.iso.datetime({ offset: true });

export const stateCodeSchema = z.enum(STATE_CODES);

export const roundSchema = z.union([z.literal(1), z.literal(2)]) satisfies z.ZodMiniType<Round>;

export const scopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('country') }),
  z.object({ kind: z.literal('region'), code: z.enum(REGION_CODES) }),
  z.object({ kind: z.literal('state'), code: stateCodeSchema }),
  z.object({ kind: z.literal('abroad') }),
]);

export const candidateResultSchema = z.object({
  number: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  party: z.string(),
  votes: count,
  share: z.number().check(z.gte(0), z.lte(100)),
});

export const tallySchema = z.object({
  scope: scopeSchema,
  candidates: z.readonly(z.array(candidateResultSchema)),
  sections: z.object({ total: count, counted: count }),
  electorate: count,
  // Optional: snapshots cached before it existed may still be served.
  countedElectorate: z.optional(count),
  turnout: count,
  votes: z.object({ valid: count, blank: count, null: count }),
  updatedAt: timestamp,
}) satisfies z.ZodMiniType<Tally>;

/** Response of `GET /api/results?round=1|2`: a consistent snapshot of every scope. */
export const resultsResponseSchema = z.object({
  /** Which round this snapshot belongs to. */
  round: roundSchema,
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
