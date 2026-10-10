import { STATE_CODES, type Scope, type StateCode, type Tally } from '@stb/domain';
import type { ElectionSnapshot, ResultsSource } from '../../ports/results-source';
import { toTally } from './mapper';
import { tseResultFileSchema } from './schema';

/** Loads the raw JSON of one TSE scope (`br`, `zz` or a lowercase state code). */
export type TseFileLoader = (scopeCode: string) => Promise<unknown>;

export class TseParseError extends Error {
  constructor(scopeCode: string, cause: unknown) {
    super(`Invalid TSE file for scope "${scopeCode}"`, { cause });
    this.name = 'TseParseError';
  }
}

/** Builds snapshots from TSE results files, whatever the way they are loaded. */
export class TseResultsSource implements ResultsSource {
  constructor(private readonly load: TseFileLoader) {}

  async fetchSnapshot(): Promise<ElectionSnapshot> {
    const [country, abroad, ...states] = await Promise.all([
      this.fetchTally('br', { kind: 'country' }),
      this.fetchTally('zz', { kind: 'abroad' }),
      ...STATE_CODES.map((code) => this.fetchTally(code.toLowerCase(), { kind: 'state', code })),
    ]);

    return {
      country,
      abroad,
      states: Object.fromEntries(STATE_CODES.map((code, index) => [code, states[index]])) as Record<
        StateCode,
        Tally
      >,
    };
  }

  private async fetchTally(scopeCode: string, scope: Scope): Promise<Tally> {
    const parsed = tseResultFileSchema.safeParse(await this.load(scopeCode));
    if (!parsed.success) throw new TseParseError(scopeCode, parsed.error);
    return toTally(parsed.data, scope);
  }
}
