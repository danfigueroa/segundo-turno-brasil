import { drawShareImage, LAYOUTS, type ShareFormat } from './render-share-image';
import type { ShareContent } from './share-content';

/**
 * MP4 first: Instagram and WhatsApp take it everywhere; WebM where it is all there is.
 * H.264 High at level 4.0, which covers 1080×1920 (Baseline 3.0 stops at 720×576).
 */
const MIME_TYPES = [
  'video/mp4;codecs=avc1.640028',
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

/** Frames per second of the share video. */
export const VIDEO_FPS = 30;

/** File name of the video: `apuracao-2026-bahia.mp4`. */
export function videoFileName(title: string, mimeType: string): string {
  const extension = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  return `apuracao-2026-${title.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
}

/** Extra time before a recording that stopped producing data is given up. */
const STALL_MARGIN_MS = 5000;

/**
 * Records the share image as a short video for Stories: the numbers count up and the map
 * fills in, then the result holds. Runs in real time (about six seconds) on a canvas that
 * never enters the page. The fallback for browsers without WebCodecs
 * (`encodeShareVideo`): rejects instead of resolving an empty or endless recording, as
 * Chrome on Android produces for large canvases.
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

  const stream = canvas.captureStream(VIDEO_FPS);
  const stopTracks = () => stream.getTracks().forEach((track) => track.stop());

  return new Promise((resolve, reject) => {
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
    } catch (error) {
      stopTracks();
      reject(error instanceof Error ? error : new Error('Could not record the share video'));
      return;
    }

    const chunks: Blob[] = [];
    let failed = false;
    const fail = (message: string) => {
      if (failed) return;
      failed = true;
      clearTimeout(watchdog);
      if (recorder.state !== 'inactive') recorder.stop();
      stopTracks();
      reject(new Error(message));
    };
    const watchdog = setTimeout(
      () => fail('The share video recording stalled'),
      timing.introMs + timing.holdMs + STALL_MARGIN_MS,
    );

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => fail('Could not record the share video');
    recorder.onstop = () => {
      if (failed) return;
      clearTimeout(watchdog);
      stopTracks();
      const type = mimeType.split(';')[0] ?? mimeType;
      const file = new File(chunks, videoFileName(content.title, mimeType), { type });
      if (file.size > 0) resolve(file);
      else reject(new Error('The share video came out empty'));
    };

    try {
      recorder.start();
    } catch {
      fail('Could not start recording the share video');
      return;
    }
    const start = performance.now();
    // Every frame is drawn, even while holding, so the stream keeps producing frames.
    const tick = (now: number) => {
      if (recorder.state !== 'recording') return;
      const elapsed = now - start;
      drawShareImage(canvas, content, format, elapsed / timing.introMs);
      if (elapsed < timing.introMs + timing.holdMs) requestAnimationFrame(tick);
      else recorder.stop();
    };
    requestAnimationFrame(tick);
  });
}
