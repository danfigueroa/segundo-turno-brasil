import { drawShareImage, LAYOUTS, type ShareFormat } from './render-share-image';
import type { ShareContent } from './share-content';

/** MP4 first: Instagram and WhatsApp take it everywhere; WebM where it is all there is. */
const MIME_TYPES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm',
] as const;

/** The video format this browser can record a canvas into, or `undefined` if none. */
export function videoMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  if (typeof HTMLCanvasElement.prototype.captureStream !== 'function') return undefined;
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export interface VideoTiming {
  /** The numbers counting up and the map filling in. */
  readonly introMs: number;
  /** The final frame, held so it can be read. */
  readonly holdMs: number;
}

export const VIDEO_TIMING: VideoTiming = { introMs: 2500, holdMs: 3500 };

const FPS = 30;

/** File name of the video: `apuracao-2026-bahia.mp4`. */
export function videoFileName(title: string, mimeType: string): string {
  const extension = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  return `apuracao-2026-${title.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
}

/**
 * Records the share image as a short video for Stories: the numbers count up and the map
 * fills in, then the result holds. Runs in real time (about six seconds) on a canvas that
 * never enters the page.
 */
export function recordShareVideo(
  content: ShareContent,
  format: ShareFormat,
  mimeType: string,
  timing: VideoTiming = VIDEO_TIMING,
): Promise<File> {
  const layout = LAYOUTS[format];
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  drawShareImage(canvas, content, format, 0);

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Could not record the share video'));
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const type = mimeType.split(';')[0] ?? mimeType;
      resolve(new File(chunks, videoFileName(content.title, mimeType), { type }));
    };
    recorder.start();
    const start = performance.now();
    // Every frame is drawn, even while holding, so the stream keeps producing frames.
    const tick = (now: number) => {
      const elapsed = now - start;
      drawShareImage(canvas, content, format, elapsed / timing.introMs);
      if (elapsed < timing.introMs + timing.holdMs) requestAnimationFrame(tick);
      else recorder.stop();
    };
    requestAnimationFrame(tick);
  });
}
