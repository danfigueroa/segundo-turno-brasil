import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareFile, downloadFile, shareFile, shareText } from './share-file';

const file = new File(['png'], 'x.png', { type: 'image/png' });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
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

describe('downloadFile', () => {
  it('clicks a link in the page and keeps the file alive for a minute', () => {
    vi.useFakeTimers();
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:share', revokeObjectURL: revoke });
    const clicks: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(document.body.contains(this)).toBe(true);
      clicks.push(this);
    });

    downloadFile(file);
    const [clicked] = clicks;
    expect(clicked?.download).toBe('x.png');
    expect(clicked?.getAttribute('href')).toBe('blob:share');
    expect(document.body.contains(clicked ?? null)).toBe(false);

    // Chrome on Android reads the file only after "Baixar arquivo?" is confirmed.
    vi.advanceTimersByTime(30_000);
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(revoke).toHaveBeenCalledWith('blob:share');
  });
});
