import type { MunicipalityResult, StateCode } from '@stb/domain';
import type { z } from 'zod';
import type { CitiesSource } from '../../ports/cities-source';
import { mapWithLimit } from './map-with-limit';
import { toTally } from './mapper';
import { tseMunicipalitiesFileSchema, tseProgressFileSchema, tseResultFileSchema } from './schema';
import { TseParseError } from './tse-results-source';

/** The three kinds of TSE file the breakdown by municipality reads. */
export interface TseCityFiles {
  /** `config/mun-e<election>-cm.json`: every municipality, with its IBGE code. */
  municipalities(): Promise<unknown>;
  /** `dados/<uf>/<uf>-e<election>-ab.json`: count progress per municipality. */
  progress(uf: string): Promise<unknown>;
  /** Results file of one municipality, by TSE scope (`ac01120`). */
  results(scope: string): Promise<unknown>;
}

export interface TseCitiesSourceOptions {
  /** Simultaneous requests to the TSE. */
  readonly concurrency?: number;
}

interface Municipality {
  readonly code: string;
  readonly ibge: string;
  readonly name: string;
}

interface CachedCity {
  /**
   * The municipality's entry in the progress file when it was downloaded (totalization
   * date, time and counted sections), or `undefined` to download it again next time.
   */
  readonly version: string | undefined;
  readonly result: MunicipalityResult;
}

interface Progress {
  readonly version: string;
  readonly counted: number;
}

function parse<S extends z.ZodType>(scope: string, schema: S, value: unknown): z.output<S> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new TseParseError(scope, parsed.error);
  return parsed.data;
}

/**
 * Builds the breakdown by municipality of a state from one TSE file per municipality (up
 * to 853, in Minas Gerais). Only municipalities whose count moved since the last read are
 * downloaded again: the state's progress file tells which. Fails as a whole if any file
 * fails, so a state is never shown with missing municipalities.
 */
export class TseCitiesSource implements CitiesSource {
  private municipalities: Promise<ReadonlyMap<string, readonly Municipality[]>> | undefined;
  private readonly cache = new Map<string, CachedCity>();
  /** Last progress read of each state, for when the progress file fails to load. */
  private readonly lastProgress = new Map<string, ReadonlyMap<string, Progress>>();
  private readonly concurrency: number;

  constructor(
    private readonly files: TseCityFiles,
    options: TseCitiesSourceOptions = {},
  ) {
    this.concurrency = options.concurrency ?? 32;
  }

  async fetchCities(uf: StateCode): Promise<MunicipalityResult[]> {
    const state = uf.toLowerCase();
    const [municipalities, progress] = await Promise.all([
      this.municipalitiesOf(state),
      this.progressOf(state),
    ]);
    const outdated = municipalities.filter((m) => {
      const version = progress.get(m.code)?.version;
      return version === undefined || this.cache.get(m.ibge)?.version !== version;
    });
    await mapWithLimit(outdated, this.concurrency, (m) => this.load(uf, m, progress.get(m.code)));
    return municipalities.map((m) => {
      const cached = this.cache.get(m.ibge);
      if (!cached) throw new Error(`Municipality ${m.ibge} was not loaded`);
      return cached.result;
    });
  }

  private async load(
    uf: StateCode,
    municipality: Municipality,
    progress: Progress | undefined,
  ): Promise<void> {
    const scope = `${uf.toLowerCase()}${municipality.code}`;
    const file = parse(scope, tseResultFileSchema, await this.files.results(scope));
    const tally = toTally(file, { kind: 'state', code: uf });
    this.cache.set(municipality.ibge, {
      // A results file behind its progress entry (CDN lag) is downloaded again next time.
      version: progress && file.s.st >= progress.counted ? progress.version : undefined,
      result: {
        ibge: municipality.ibge,
        name: municipality.name,
        electorate: tally.electorate,
        turnout: tally.turnout,
        // Candidates without votes are left out: a state has up to 853 municipalities.
        votes: Object.fromEntries(
          tally.candidates.filter((c) => c.votes > 0).map((c) => [c.number, c.votes]),
        ),
        ballots: tally.votes,
        sections: tally.sections,
        updatedAt: tally.updatedAt,
      },
    });
  }

  /**
   * Version of each municipality's count. When the progress file fails, the last one read
   * stands in (the municipalities already loaded are kept rather than downloaded again).
   * Some progress files are only published once the count starts: without any, every
   * municipality is downloaded again.
   */
  private async progressOf(state: string): Promise<ReadonlyMap<string, Progress>> {
    let value: unknown;
    try {
      value = await this.files.progress(state);
    } catch {
      return this.lastProgress.get(state) ?? new Map();
    }
    const file = parse(`${state}-ab`, tseProgressFileSchema, value);
    const progress = new Map(
      file.abr.map((m) => [m.cdabr, { version: `${m.dt} ${m.ht} ${m.s.st}`, counted: m.s.st }]),
    );
    this.lastProgress.set(state, progress);
    return progress;
  }

  /** The municipality list never changes during an election: read it once. */
  private async municipalitiesOf(state: string): Promise<readonly Municipality[]> {
    this.municipalities ??= this.files.municipalities().then((value) => {
      const file = parse('cm', tseMunicipalitiesFileSchema, value);
      return new Map(
        file.abr.map((scope) => [
          scope.cd,
          scope.mu.map((m) => ({ code: m.cd, ibge: m.cdi, name: m.nm })),
        ]),
      );
    });
    try {
      const list = (await this.municipalities).get(state);
      if (!list) throw new Error(`No municipalities for "${state}" in the TSE config`);
      return list;
    } catch (error) {
      this.municipalities = undefined;
      throw error;
    }
  }
}
