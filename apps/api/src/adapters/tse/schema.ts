import { z } from 'zod';

/** TSE encodes every number as a string; an empty string means "no data yet". */
const tseInt = z.string().transform((value, ctx) => {
  if (value === '') return 0;
  if (!/^\d+$/.test(value)) {
    ctx.addIssue({ code: 'custom', message: `Expected an integer string, got "${value}"` });
    return z.NEVER;
  }
  return Number(value);
});

const candidateSchema = z.object({
  /** Ballot number. */
  n: z.string(),
  /** Ballot name. */
  nmu: z.string(),
  /** Valid votes received. */
  vap: tseInt,
});

const partySchema = z.object({
  sg: z.string(),
  cand: z.array(candidateSchema),
});

const officeSchema = z.object({
  cd: z.string(),
  agr: z.array(z.object({ par: z.array(partySchema) })),
});

/**
 * Subset of the TSE results file (`<uf>-c0001-e<election>-u.json`) that we rely on.
 * Unknown fields are stripped, so additions by the TSE do not break parsing.
 */
export const tseResultFileSchema = z.object({
  /** Scope code: `br`, `zz` (abroad) or a lowercase state code. */
  cdabr: z.string(),
  /** Date and time the file was generated. */
  dg: z.string(),
  hg: z.string(),
  /** Date and time of the last totalization (empty before counting starts). */
  dt: z.string(),
  ht: z.string(),
  carg: z.array(officeSchema).min(1),
  /** Sections: total and totalized. */
  s: z.object({ ts: tseInt, st: tseInt }),
  /** Electorate: total and turnout. */
  e: z.object({ te: tseInt, c: tseInt }),
  /** Votes: valid, blank and null. */
  v: z.object({ vv: tseInt, vb: tseInt, tvn: tseInt }),
});

export type TseResultFile = z.infer<typeof tseResultFileSchema>;

/** Municipalities of each scope, from `config/mun-e<election>-cm.json`. */
export const tseMunicipalitiesFileSchema = z.object({
  abr: z.array(
    z.object({
      /** Lowercase state code (also `zz` for abroad). */
      cd: z.string(),
      mu: z.array(
        z.object({
          /** TSE municipality code, e.g. "01120". */
          cd: z.string(),
          /** IBGE code, e.g. "1200013". */
          cdi: z.string(),
          nm: z.string(),
        }),
      ),
    }),
  ),
});

/**
 * Count progress of every municipality of a state (`<uf>-e<election>-ab.json`): no votes,
 * but enough to tell which municipalities changed since the last read.
 */
export const tseProgressFileSchema = z.object({
  abr: z.array(
    z.object({
      cdabr: z.string(),
      dt: z.string(),
      ht: z.string(),
      s: z.object({ st: tseInt }),
    }),
  ),
});
