import { drawShareImage, LAYOUTS, type ShareFormat } from './render-share-image';
import type { ShareContent } from './share-content';
import {
  recordShareVideo,
  VIDEO_FPS,
  VIDEO_TIMING,
  videoFileName,
  videoMimeType,
  type VideoTiming,
} from './share-video';

const BITRATE = 6_000_000;

/** The browser has no H.264 encoder for the video's size. */
export class VideoUnsupportedError extends Error {
  constructor() {
    super('This browser cannot encode the share video as H.264');
    this.name = 'VideoUnsupportedError';
  }
}

/** True when this browser can make the share video, one way or another. */
export function canMakeVideo(): boolean {
  return typeof VideoEncoder !== 'undefined' || videoMimeType() !== undefined;
}

/**
 * Encodes the share video frame by frame with WebCodecs into a regular MP4 (H.264, index
 * at the start), which Instagram and WhatsApp accept. Unlike recording in real time, no
 * frame is dropped on a slow phone and the size is not limited by `MediaRecorder` on
 * Android. Mediabunny is loaded only here.
 */
export async function encodeShareVideo(
  content: ShareContent,
  format: ShareFormat,
  timing: VideoTiming = VIDEO_TIMING,
): Promise<File> {
  const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality, canEncodeVideo } =
    await import('mediabunny');
  const { width, height } = LAYOUTS[format];
  const quality = new Quality({ bitrate: BITRATE });
  if (!(await canEncodeVideo('avc', { width, height, quality, frameRate: VIDEO_FPS }))) {
    throw new VideoUnsupportedError();
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
  const source = new CanvasSource(canvas, { codec: 'avc', quality, keyFrameInterval: 1 });
  output.addVideoTrack(source, { frameRate: VIDEO_FPS });

  try {
    await output.start();
    const frames = Math.round(((timing.introMs + timing.holdMs) / 1000) * VIDEO_FPS);
    let final = false;
    for (let frame = 0; frame < frames; frame++) {
      // The hold repeats the final frame: it is drawn once.
      if (!final) {
        const progress = (frame * 1000) / VIDEO_FPS / timing.introMs;
        drawShareImage(canvas, content, format, progress);
        final = progress >= 1;
      }
      await source.add(frame / VIDEO_FPS, 1 / VIDEO_FPS);
    }
    await output.finalize();
  } catch (error) {
    await output.cancel().catch(() => undefined);
    throw error;
  }

  if (!target.buffer) throw new Error('The share video came out empty');
  return new File([target.buffer], videoFileName(content.title, 'video/mp4'), {
    type: 'video/mp4',
  });
}

/**
 * The share video: encoded with WebCodecs where possible, otherwise recorded in real time
 * with `MediaRecorder` (older browsers).
 */
export async function makeShareVideo(content: ShareContent, format: ShareFormat): Promise<File> {
  try {
    return await encodeShareVideo(content, format);
  } catch (error) {
    const mimeType = videoMimeType();
    if (!mimeType) throw error;
    return recordShareVideo(content, format, mimeType);
  }
}
