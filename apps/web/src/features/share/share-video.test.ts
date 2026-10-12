import { afterEach, describe, expect, it, vi } from 'vitest';
import { videoFileName, videoMimeType } from './share-video';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('videoMimeType', () => {
  it('is undefined without MediaRecorder', () => {
    vi.stubGlobal('MediaRecorder', undefined);
    expect(videoMimeType()).toBeUndefined();
  });

  it('prefers MP4 and falls back to WebM', () => {
    HTMLCanvasElement.prototype.captureStream ??= () => new MediaStream();
    vi.spyOn(HTMLCanvasElement.prototype, 'captureStream');
    const supported = new Set(['video/webm']);
    vi.stubGlobal('MediaRecorder', { isTypeSupported: (type: string) => supported.has(type) });
    expect(videoMimeType()).toBe('video/webm');
    supported.add('video/mp4');
    expect(videoMimeType()).toBe('video/mp4');
  });
});

describe('videoFileName', () => {
  it('names the file after the scope with the right extension', () => {
    expect(videoFileName('Rio de Janeiro', 'video/mp4;codecs=avc1.42E01E')).toBe(
      'apuracao-2026-rio-de-janeiro.mp4',
    );
    expect(videoFileName('Bahia', 'video/webm;codecs=vp9')).toBe('apuracao-2026-bahia.webm');
  });
});
