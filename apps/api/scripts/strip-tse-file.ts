/** Shared by the fixture scripts: TSE results files minus the fields we never read. */

export interface RawFile {
  cdabr: string;
  dg: string;
  hg: string;
  dt: string;
  ht: string;
  carg: {
    cd: string;
    agr: { par: { sg: string; cand: { n: string; nmu: string; vap: string }[] }[] }[];
  }[];
  s: { ts: string; st: string };
  e: { te: string; c: string };
  v: { vv: string; vb: string; tvn: string };
}

/** Same shape as the TSE file, minus everything we do not use. */
export function strip(file: RawFile): RawFile {
  return {
    cdabr: file.cdabr,
    dg: file.dg,
    hg: file.hg,
    dt: file.dt,
    ht: file.ht,
    carg: file.carg.map((office) => ({
      cd: office.cd,
      agr: office.agr.map((coalition) => ({
        par: coalition.par.map((party) => ({
          sg: party.sg,
          cand: party.cand.map(({ n, nmu, vap }) => ({ n, nmu, vap })),
        })),
      })),
    })),
    s: { ts: file.s.ts, st: file.s.st },
    e: { te: file.e.te, c: file.e.c },
    v: { vv: file.v.vv, vb: file.v.vb, tvn: file.v.tvn },
  };
}
