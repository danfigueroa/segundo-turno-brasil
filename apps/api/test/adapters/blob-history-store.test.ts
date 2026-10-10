import { describe, expect, it, vi } from 'vitest';
import { BlobHistoryStore, type BlobApi } from '../../src/adapters/history/blob-history-store';
import { historyEntry } from '../helpers';

/** In-memory stand-in for Vercel Blob with ETags and conditional writes. */
function fakeBlob(initial?: unknown) {
  let file = initial === undefined ? undefined : { body: JSON.stringify(initial), etag: 'v0' };
  let version = 0;
  const api = {
    get: vi.fn(async () =>
      file
        ? {
            statusCode: 200,
            stream: new Response(file.body).body,
            blob: { etag: file.etag },
          }
        : null,
    ),
    put: vi.fn(async (_pathname: string, body: string, options: { ifMatch?: string }) => {
      if (options.ifMatch !== undefined && options.ifMatch !== file?.etag) {
        throw new Error('precondition failed');
      }
      version += 1;
      file = { body, etag: `v${version}` };
      return {};
    }),
  };
  return {
    api: api as unknown as BlobApi,
    mocks: api,
    stored: () => (file ? (JSON.parse(file.body) as { entries: unknown[] }) : undefined),
    overwrite: (content: unknown) => {
      version += 1;
      file = { body: JSON.stringify(content), etag: `v${version}` };
    },
  };
}

const options = { pathname: 'history/6258.json', token: 'test-token' };

describe('BlobHistoryStore', () => {
  it('reads an empty history while the file does not exist', async () => {
    const blob = fakeBlob();
    expect(await new BlobHistoryStore({ ...options, blob: blob.api }).read()).toEqual([]);
  });

  it('creates the file on the first append without overwriting', async () => {
    const blob = fakeBlob();
    await new BlobHistoryStore({ ...options, blob: blob.api }).append(historyEntry(10));
    expect(blob.stored()?.entries).toHaveLength(1);
    expect(blob.mocks.put).toHaveBeenCalledWith(
      'history/6258.json',
      expect.any(String),
      expect.objectContaining({ access: 'private', allowOverwrite: false }),
    );
  });

  it('appends with the ETag it read, bypassing the cache', async () => {
    const blob = fakeBlob({ entries: [historyEntry(10)] });
    await new BlobHistoryStore({ ...options, blob: blob.api }).append(historyEntry(20));
    expect(blob.stored()?.entries).toHaveLength(2);
    expect(blob.mocks.get).toHaveBeenCalledWith(
      'history/6258.json',
      expect.objectContaining({ useCache: false }),
    );
    expect(blob.mocks.put).toHaveBeenCalledWith(
      'history/6258.json',
      expect.any(String),
      expect.objectContaining({ ifMatch: 'v0', allowOverwrite: true }),
    );
  });

  it('does not write when the stored count is already ahead', async () => {
    const blob = fakeBlob({ entries: [historyEntry(30)] });
    await new BlobHistoryStore({ ...options, blob: blob.api }).append(historyEntry(20));
    expect(blob.mocks.put).not.toHaveBeenCalled();
  });

  it('retries once on a conflicting write, keeping the other writer’s entry', async () => {
    const blob = fakeBlob({ entries: [historyEntry(10)] });
    blob.mocks.put.mockImplementationOnce(async () => {
      blob.overwrite({ entries: [historyEntry(10), historyEntry(15)] });
      throw new Error('precondition failed');
    });
    await new BlobHistoryStore({ ...options, blob: blob.api }).append(historyEntry(20));
    expect(blob.stored()?.entries).toHaveLength(3);
  });

  it('rejects a malformed file', async () => {
    const blob = fakeBlob({ entries: [{ at: 'yesterday' }] });
    await expect(new BlobHistoryStore({ ...options, blob: blob.api }).read()).rejects.toThrow();
  });
});
