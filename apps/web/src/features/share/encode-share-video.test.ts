import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_I18N as pt } from '../../i18n/i18n';
import { resultsResponse } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import {
  canMakeVideo,
  encodeShareVideo,
  makeShareVideo,
  VideoUnsupportedError,
} from './encode-share-video';
import { drawShareImage } from './render-share-image';
import type * as RenderShareImage from './render-share-image';
import { shareContentFrom } from './share-content';
import { recordShareVideo, videoMimeType } from './share-video';
import type * as ShareVideo from './share-video';

const mocks = vi.hoisted(() => ({
  encodable: true,
  finalizeError: undefined as Error | undefined,
  timestamps: [] as number[],
  cancel: vi.fn(async () => undefined),
}));

vi.mock('mediabunny', () => ({
  canEncodeVideo: async () => mocks.encodable,
  Quality: vi.fn(),
  Mp4OutputFormat: vi.fn(),
  BufferTarget: class {
    buffer: ArrayBuffer | null = null;
  },
  CanvasSource: class {
    async add(timestamp: number) {
      mocks.timestamps.push(timestamp);
    }
  },
  Output: class {
    private readonly target: { buffer: ArrayBuffer | null };
    constructor(options: { target: { buffer: ArrayBuffer | null } }) {
      this.target = options.target;
    }
    addVideoTrack = vi.fn();
    start = vi.fn(async () => undefined);
    async finalize() {
      if (mocks.finalizeError) throw mocks.finalizeError;
      this.target.buffer = new ArrayBuffer(16);
    }
    cancel = mocks.cancel;
  },
}));

vi.mock('./render-share-image', async (importOriginal) => ({
  ...(await importOriginal<typeof RenderShareImage>()),
  drawShareImage: vi.fn(),
}));

vi.mock('./share-video', async (importOriginal) => ({
  ...(await importOriginal<typeof ShareVideo>()),
  videoMimeType: vi.fn(() => undefined),
  recordShareVideo: vi.fn(async () => new File(['webm'], 'x.webm', { type: 'video/webm' })),
}));

const data = resultsResponse();
const content = shareContentFrom(
  data,
  { kind: 'state', code: 'BA' },
  finalistsOf(data.country),
  pt,
  'x',
);

beforeEach(() => {
  mocks.encodable = true;
  mocks.finalizeError = undefined;
  mocks.timestamps = [];
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('encodeShareVideo', () => {
  it('encodes six seconds at 30 fps into an MP4', async () => {
    const file = await encodeShareVideo(content, 'story');
    expect(mocks.timestamps).toHaveLength(180);
    expect(mocks.timestamps[0]).toBe(0);
    expect(mocks.timestamps[179]).toBeCloseTo(179 / 30);
    expect(file.type).toBe('video/mp4');
    expect(file.name).toBe('apuracao-2026-bahia.mp4');
    expect(file.size).toBe(16);
  });

  it('draws the intro frame by frame and the held result once', async () => {
    await encodeShareVideo(content, 'feed');
    const draw = vi.mocked(drawShareImage);
    // 2.5 s of intro at 30 fps: frames 0 to 75, the last one at progress 1.
    expect(draw).toHaveBeenCalledTimes(76);
    expect(draw.mock.calls[0]?.[3]).toBe(0);
    expect(draw.mock.calls[75]?.[3]).toBe(1);
  });

  it('refuses when the browser cannot encode H.264 at that size', async () => {
    mocks.encodable = false;
    await expect(encodeShareVideo(content, 'story')).rejects.toBeInstanceOf(VideoUnsupportedError);
    expect(mocks.timestamps).toHaveLength(0);
  });

  it('cancels the output when encoding fails', async () => {
    mocks.finalizeError = new Error('encoder crashed');
    await expect(encodeShareVideo(content, 'story')).rejects.toThrow('encoder crashed');
    expect(mocks.cancel).toHaveBeenCalled();
  });
});

describe('makeShareVideo', () => {
  it('uses WebCodecs when it can', async () => {
    const file = await makeShareVideo(content, 'story');
    expect(file.type).toBe('video/mp4');
    expect(recordShareVideo).not.toHaveBeenCalled();
  });

  it('falls back to MediaRecorder', async () => {
    mocks.encodable = false;
    vi.mocked(videoMimeType).mockReturnValueOnce('video/webm');
    const file = await makeShareVideo(content, 'story');
    expect(file.type).toBe('video/webm');
    expect(recordShareVideo).toHaveBeenCalledWith(content, 'story', 'video/webm');
  });

  it('fails when neither works', async () => {
    mocks.encodable = false;
    await expect(makeShareVideo(content, 'story')).rejects.toBeInstanceOf(VideoUnsupportedError);
  });
});

describe('canMakeVideo', () => {
  it('is true with WebCodecs', () => {
    vi.stubGlobal('VideoEncoder', vi.fn());
    expect(canMakeVideo()).toBe(true);
  });

  it('is true with MediaRecorder only', () => {
    vi.stubGlobal('VideoEncoder', undefined);
    vi.mocked(videoMimeType).mockReturnValueOnce('video/mp4');
    expect(canMakeVideo()).toBe(true);
  });

  it('is false with neither', () => {
    vi.stubGlobal('VideoEncoder', undefined);
    expect(canMakeVideo()).toBe(false);
  });
});
