import { rankCandidates, type Scope, type Tally } from '@stb/domain';
import type { TseResultFile } from './schema';

/** TSE office code for "Presidente". */
export const PRESIDENT_OFFICE = '1';

/** TSE publishes Brasília time (UTC-3, no daylight saving since 2019). */
const BRASILIA_OFFSET = '-03:00';

/** Converts TSE `dd/mm/yyyy` + `hh:mm:ss` into an ISO 8601 timestamp. */
export function parseTseDateTime(date: string, time: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (!match || !/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    throw new Error(`Invalid TSE date/time: "${date}" "${time}"`);
  }
  const [, day, month, year] = match;
  return `${year}-${month}-${day}T${time}${BRASILIA_OFFSET}`;
}

/** Maps a parsed TSE results file into a domain tally for the given scope. */
export function toTally(file: TseResultFile, scope: Scope): Tally {
  const office = file.carg.find((c) => c.cd === PRESIDENT_OFFICE);
  if (!office) throw new Error(`No presidential results in TSE file "${file.cdabr}"`);

  const candidates = office.agr.flatMap((coalition) =>
    coalition.par.flatMap((party) =>
      party.cand.map((c) => ({ number: c.n, name: c.nmu, party: party.sg, votes: c.vap })),
    ),
  );

  const hasTotalization = file.dt !== '' && file.ht !== '';
  return {
    scope,
    candidates: rankCandidates(candidates),
    sections: { total: file.s.ts, counted: file.s.st },
    electorate: file.e.te,
    turnout: file.e.c,
    votes: { valid: file.v.vv, blank: file.v.vb, null: file.v.tvn },
    updatedAt: hasTotalization
      ? parseTseDateTime(file.dt, file.ht)
      : parseTseDateTime(file.dg, file.hg),
  };
}
