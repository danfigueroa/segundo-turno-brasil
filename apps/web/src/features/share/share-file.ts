/** Converts a canvas into a PNG file ready to share or download. */
export function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(new File([blob], name, { type: 'image/png' }));
      else reject(new Error('Could not encode the share image'));
    }, 'image/png');
  });
}

/** True when the browser can open the native share sheet with an image (iOS, Android). */
export function canShareFile(file: File): boolean {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
}

/**
 * Opens the native share sheet (Instagram Stories, WhatsApp…). Must run inside the click
 * handler, with the file already prepared, or Safari blocks it. Resolves `false` if the
 * user dismissed the sheet.
 */
export async function shareFile(file: File, text: string): Promise<boolean> {
  try {
    await navigator.share({ files: [file], text });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    throw error;
  }
}

/**
 * How long the downloaded file's URL stays alive. Chrome on Android asks "Baixar arquivo?"
 * first and only reads the file once the user confirms.
 */
const DOWNLOAD_URL_LIFETIME_MS = 60_000;

/** Fallback for desktops and browsers without file sharing. */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.hidden = true;
  // Firefox only follows links that are in the page.
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
}

export type TextShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed';

/**
 * Sends the text through the native share sheet (WhatsApp, Telegram…) or, without one,
 * copies it to the clipboard to paste anywhere.
 */
export async function shareText(text: string): Promise<TextShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
