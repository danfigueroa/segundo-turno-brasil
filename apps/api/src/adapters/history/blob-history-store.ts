import { get, put } from '@vercel/blob';
import { appendEntry, STATE_CODES, type HistoryEntry } from '@stb/domain';
import { z } from 'zod';
import type { HistoryStore } from '../../ports/history-store';

const count = z.number().int().nonnegative();

const sampleSchema = z.object({
  counted: count,
  total: count,
  votes: z.record(z.string(), count),
});

const historyFileSchema = z.object({
  entries: z.array(
    z.object({
      at: z.iso.datetime({ offset: true }),
      samples: z.record(z.enum(['BR', 'ZZ', ...STATE_CODES]), sampleSchema),
    }),
  ),
});

/** The subset of the `@vercel/blob` SDK this store uses (replaced in tests). */
export interface BlobApi {
  readonly get: typeof get;
  readonly put: typeof put;
}

/**
 * How to authenticate with the Blob store: a static read-write token, or the store id
 * with Vercel OIDC (token taken from the request, or resolved by the SDK when absent).
 */
export type BlobCredentials =
  { readonly token: string } | { readonly storeId: string; readonly oidcToken?: string };

export interface BlobHistoryStoreOptions {
  /** Pathname of the history file inside the Blob store. */
  readonly pathname: string;
  /** Called on every operation: OIDC tokens are short-lived and come with each request. */
  readonly credentials: () => BlobCredentials;
  readonly timeoutMs?: number;
  readonly blob?: BlobApi;
}

interface Loaded {
  readonly entries: readonly HistoryEntry[];
  /** ETag of the stored file; `undefined` while it does not exist. */
  readonly etag: string | undefined;
}

/**
 * Keeps the history as a single JSON file in Vercel Blob (ADR 0011). Reads go through
 * the Blob CDN cache; appends read the latest version and write it back only if nobody
 * changed it meanwhile (ETag), retrying once on a conflict.
 */
export class BlobHistoryStore implements HistoryStore {
  private readonly blob: BlobApi;

  constructor(private readonly options: BlobHistoryStoreOptions) {
    this.blob = options.blob ?? { get, put };
  }

  async read(): Promise<readonly HistoryEntry[]> {
    return (await this.load(true)).entries;
  }

  async append(entry: HistoryEntry): Promise<void> {
    try {
      await this.tryAppend(entry);
    } catch {
      await this.tryAppend(entry);
    }
  }

  private async tryAppend(entry: HistoryEntry): Promise<void> {
    const { entries, etag } = await this.load(false);
    const next = appendEntry(entries, entry);
    if (next === entries) return;
    await this.blob.put(this.options.pathname, JSON.stringify({ entries: next }), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: etag !== undefined,
      cacheControlMaxAge: 60,
      contentType: 'application/json',
      ...this.options.credentials(),
      abortSignal: this.signal(),
      ...(etag ? { ifMatch: etag } : {}),
    });
  }

  private async load(useCache: boolean): Promise<Loaded> {
    const result = await this.blob.get(this.options.pathname, {
      access: 'private',
      useCache,
      ...this.options.credentials(),
      abortSignal: this.signal(),
    });
    if (result?.statusCode !== 200) return { entries: [], etag: undefined };
    const file = historyFileSchema.parse(await new Response(result.stream).json());
    return { entries: file.entries, etag: result.blob.etag };
  }

  private signal(): AbortSignal {
    return AbortSignal.timeout(this.options.timeoutMs ?? 5000);
  }
}
