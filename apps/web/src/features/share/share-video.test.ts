import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_I18N as pt } from '../../i18n/i18n';
import { resultsResponse } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import type * as RenderShareImage from './render-share-image';
import { shareContentFrom } from './share-content';
import { recordShareVideo, videoFileName, videoMimeType } from './share-video';

vi.mock('./render-share-image', async (importOriginal) => ({
  ...(await importOriginal<typeof RenderShareImage>()),
  drawShareImage: vi.fn(),
}));

const data = resultsResponse();
const content = shareContentFrom(
  data,
  { kind: 'state', code: 'BA' },
  finalistsOf(data.country),
  pt,
  'x',
);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
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

  it('asks for an H.264 level that fits 1080×1920', () => {
    HTMLCanvasElement.prototype.captureStream ??= () => new MediaStream();
    vi.spyOn(HTMLCanvasElement.prototype, 'captureStream');
    const isTypeSupported = vi.fn(() => true);
    vi.stubGlobal('MediaRecorder', { isTypeSupported });
    expect(videoMimeType()).toBe('video/mp4;codecs=avc1.640028');
    expect(isTypeSupported).not.toHaveBeenCalledWith('video/mp4;codecs=avc1.42E01E');
  });
});

describe('videoFileName', () => {
  it('names the file after the scope with the right extension', () => {
    expect(videoFileName('Rio de Janeiro', 'video/mp4;codecs=avc1.640028')).toBe(
      'apuracao-2026-rio-de-janeiro.mp4',
    );
    expect(videoFileName('Bahia', 'video/webm;codecs=vp9')).toBe('apuracao-2026-bahia.webm');
  });
});

describe('recordShareVideo', () => {
  const track = { stop: vi.fn() };
  const recorders: FakeRecorder[] = [];
  const recorder = () => recorders.at(-1);

  /** A MediaRecorder the test drives by hand. */
  class FakeRecorder {
    state: RecordingState = 'inactive';
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onerror: (() => void) | null = null;
    onstop: (() => void) | null = null;
    stop = vi.fn(() => {
      this.state = 'inactive';
      queueMicrotask(() => this.onstop?.());
    });
    constructor() {
      recorders.push(this);
    }
    start() {
      this.state = 'recording';
    }
  }

  beforeEach(() => {
    recorders.length = 0;
    track.stop.mockClear();
    HTMLCanvasElement.prototype.captureStream ??= () => new MediaStream();
    vi.spyOn(HTMLCanvasElement.prototype, 'captureStream').mockReturnValue({
      getTracks: () => [track],
    } as unknown as MediaStream);
    // Frames are driven by hand: the loop never runs on its own.
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    vi.stubGlobal('MediaRecorder', FakeRecorder);
  });

  it('resolves the recorded video', async () => {
    const video = recordShareVideo(content, 'story', 'video/mp4;codecs=avc1.640028');
    recorder()?.ondataavailable?.({ data: new Blob(['mp4']) });
    recorder()?.stop();
    const file = await video;
    expect(file.type).toBe('video/mp4');
    expect(file.name).toBe('apuracao-2026-bahia.mp4');
    expect(track.stop).toHaveBeenCalled();
  });

  it('rejects an empty recording', async () => {
    const video = recordShareVideo(content, 'story', 'video/webm');
    recorder()?.stop();
    await expect(video).rejects.toThrow('empty');
  });

  it('rejects and releases the canvas stream when the recorder cannot be created', async () => {
    vi.stubGlobal(
      'MediaRecorder',
      vi.fn(function () {
        throw new Error('no encoder');
      }),
    );
    await expect(recordShareVideo(content, 'story', 'video/mp4')).rejects.toThrow('no encoder');
    expect(track.stop).toHaveBeenCalled();
  });

  it('gives up on a recording that never stops', async () => {
    // Only the watchdog's clock: the frame loop stays stubbed, as if it had stalled.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const video = recordShareVideo(content, 'story', 'video/mp4', { introMs: 100, holdMs: 100 });
    const outcome = expect(video).rejects.toThrow('stalled');
    await vi.advanceTimersByTimeAsync(5200);
    await outcome;
    expect(recorder()?.stop).toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalled();
  });
});
