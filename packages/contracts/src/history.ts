import type { CountPoint } from '@stb/domain';
import * as z from 'zod/mini';
import { scopeSchema } from './results';

const count = z.int().check(z.nonnegative());
const timestamp = z.iso.datetime({ offset: true });

export const countPointSchema = z.object({
  at: timestamp,
  counted: count,
  total: count,
  votes: z.record(z.string(), count),
}) satisfies z.ZodMiniType<CountPoint>;

/** Response of `GET /api/history?scope=…`: how the runoff count of one scope evolved. */
export const historyResponseSchema = z.object({
  scope: scopeSchema,
  /** One point per national count update, oldest first. */
  points: z.readonly(z.array(countPointSchema)),
  /** When our API read the history. */
  fetchedAt: timestamp,
  /** True when the history store was unreachable and an older copy is being served. */
  stale: z.boolean(),
});

export type HistoryResponse = z.infer<typeof historyResponseSchema>;
