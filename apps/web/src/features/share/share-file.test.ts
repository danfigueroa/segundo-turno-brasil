import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareFile, shareFile, shareText } from './share-file';

const file = new File(['png'], 'x.png', { type: 'image/png' });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('canShareFile', () => {
  it('is false when the Web Share API is missing', () => {
    vi.stubGlobal('navigator', {});
    expect(canShareFile(file)).toBe(false);
  });

  it('asks the browser whether files can be shared', () => {
    const canShare = vi.fn(() => true);
    vi.stubGlobal('navigator', { canShare });
    expect(canShareFile(file)).toBe(true);
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
  });
});

describe('shareFile', () => {
  it('resolves false when the user dismisses the share sheet', async () => {
    vi.stubGlobal('navigator', {
      share: vi.fn(async () => {
        throw new DOMException('dismissed', 'AbortError');
      }),
    });
    await expect(shareFile(file, 'text')).resolves.toBe(false);
  });

  it('rethrows real failures', async () => {
    vi.stubGlobal('navigator', {
      share: vi.fn(async () => {
        throw new DOMException('denied', 'NotAllowedError');
      }),
    });
    await expect(shareFile(file, 'text')).rejects.toMatchObject({ name: 'NotAllowedError' });
  });
});

describe('shareText', () => {
  it('opens the share sheet when there is one', async () => {
    const share = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { share });
    await expect(shareText('placar')).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({ text: 'placar' });
  });

  it('reports a dismissed share sheet', async () => {
    vi.stubGlobal('navigator', {
      share: vi.fn(async () => {
        throw new DOMException('dismissed', 'AbortError');
      }),
    });
    await expect(shareText('placar')).resolves.toBe('dismissed');
  });

  it('copies the text without a share sheet', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await expect(shareText('placar')).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('placar');
  });

  it('reports when neither works', async () => {
    vi.stubGlobal('navigator', {});
    await expect(shareText('placar')).resolves.toBe('failed');
  });
});
