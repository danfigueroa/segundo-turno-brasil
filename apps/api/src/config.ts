import { z } from 'zod';

const envSchema = z.object({
  /** `tse` (production), `fixture` (offline, final results) or `simulation` (live replay). */
  DATA_SOURCE: z.enum(['tse', 'fixture', 'simulation']).default('tse'),
  TSE_BASE_URL: z.url().default('https://resultados.tse.jus.br/oficial/ele2026'),
  /** 6258 = 2026 presidential runoff, per `oficial/comum/config/ele-c.json`. */
  TSE_ELECTION_CODE: z.string().regex(/^\d+$/).default('6258'),
  /** 6257 = 2026 presidential first round (final results). */
  TSE_FIRST_ROUND_ELECTION_CODE: z.string().regex(/^\d+$/).default('6257'),
  TSE_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  /**
   * Directory with `<scope>.json` TSE files of the first round, relative to the working
   * directory. Feeds the first round in `fixture`/`simulation` modes and the replayed runoff.
   */
  FIXTURES_DIR: z.string().default('test/fixtures/ele2026-6257'),
  SIMULATION_DURATION_MINUTES: z.coerce.number().positive().default(10),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined>): Config {
  return envSchema.parse(env);
}
