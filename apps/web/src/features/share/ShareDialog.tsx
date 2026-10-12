import { useEffect, useRef, useState } from 'react';
import { loadShareFonts, renderShareImage, type ShareFormat } from './render-share-image';
import type { ShareContent } from './share-content';
import {
  canShareFile,
  canvasToFile,
  downloadFile,
  shareFile,
  shareText,
  type TextShareOutcome,
} from './share-file';
import { shareTextOf } from './share-text';
import { recordShareVideo, videoMimeType } from './share-video';
import styles from './Share.module.css';

interface Props {
  readonly content: ShareContent;
  readonly onClose: () => void;
}

interface Prepared {
  readonly file: File;
  readonly previewUrl: string;
}

const FORMATS: { value: ShareFormat; label: string }[] = [
  { value: 'story', label: 'Stories (9:16)' },
  { value: 'feed', label: 'Feed (4:5)' },
];

/**
 * Previews the share image and prepares the file up front, so the share button can call
 * `navigator.share` synchronously within the tap (a Safari requirement).
 */
export default function ShareDialog({ content, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<ShareFormat>('story');
  const [prepared, setPrepared] = useState<Prepared>();
  const [error, setError] = useState(false);
  const [textOutcome, setTextOutcome] = useState<TextShareOutcome>();
  // Recorded on request (it takes a few seconds), then shared with a second tap: Safari
  // only opens the share sheet right after a tap.
  const [mimeType] = useState(videoMimeType);
  const [video, setVideo] = useState<File | 'recording' | 'failed'>();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let previewUrl: string | undefined;
    const fileName = `apuracao-2026-${content.title.toLowerCase().replace(/\s+/g, '-')}.png`;

    loadShareFonts()
      .then(() => canvasToFile(renderShareImage(content, format), fileName))
      .then((file) => {
        if (cancelled) return;
        previewUrl = URL.createObjectURL(file);
        setPrepared({ file, previewUrl });
      })
      .catch(() => !cancelled && setError(true));

    return () => {
      cancelled = true;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPrepared(undefined);
      setVideo(undefined);
    };
  }, [content, format]);

  const recordVideo = () => {
    if (!mimeType) return;
    setVideo('recording');
    loadShareFonts()
      .then(() => recordShareVideo(content, format, mimeType))
      .then(setVideo)
      .catch(() => setVideo('failed'));
  };

  const text =
    content.round === 1
      ? `Resultado do 1º turno em ${content.title}: veja em ${content.siteUrl}`
      : `Apuração do 2º turno em ${content.title}: acompanhe ao vivo em ${content.siteUrl}`;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby="share-title"
    >
      <div className={styles.dialogHeader}>
        <h2 id="share-title">Compartilhar resultado</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
          ×
        </button>
      </div>

      <div className={styles.formats} role="radiogroup" aria-label="Formato da imagem">
        {FORMATS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="radio"
            aria-checked={format === f.value}
            className={styles.format}
            onClick={() => setFormat(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.preview} data-format={format}>
        {prepared ? (
          <img src={prepared.previewUrl} alt={`Prévia da imagem: apuração em ${content.title}`} />
        ) : (
          <span>{error ? 'Não foi possível gerar a imagem.' : 'Gerando imagem…'}</span>
        )}
      </div>

      <div className={styles.actions}>
        {prepared && canShareFile(prepared.file) && (
          <button
            type="button"
            className={styles.primary}
            onClick={() => void shareFile(prepared.file, text)}
          >
            Compartilhar
          </button>
        )}
        <button
          type="button"
          className={styles.secondary}
          disabled={!prepared}
          onClick={() => prepared && downloadFile(prepared.file)}
        >
          Baixar imagem
        </button>
        {mimeType && <VideoActions video={video} text={text} onRecord={recordVideo} />}
        <button
          type="button"
          className={styles.secondary}
          onClick={() =>
            void shareText(shareTextOf(content, window.location.href)).then(setTextOutcome)
          }
        >
          Enviar como texto
        </button>
        <p className={styles.status} role="status">
          {textOutcome === 'copied'
            ? 'Texto copiado. É só colar no WhatsApp.'
            : textOutcome === 'failed'
              ? 'Não foi possível copiar o texto.'
              : ''}
        </p>
      </div>
    </dialog>
  );
}

interface VideoActionsProps {
  readonly video: File | 'recording' | 'failed' | undefined;
  readonly text: string;
  readonly onRecord: () => void;
}

/** "Gerar vídeo animado", then share or download the recorded video. */
function VideoActions({ video, text, onRecord }: VideoActionsProps) {
  if (video instanceof File) {
    return (
      <>
        {canShareFile(video) && (
          <button
            type="button"
            className={styles.primary}
            onClick={() => void shareFile(video, text)}
          >
            Compartilhar vídeo
          </button>
        )}
        <button type="button" className={styles.secondary} onClick={() => downloadFile(video)}>
          Baixar vídeo
        </button>
      </>
    );
  }
  return (
    <button
      type="button"
      className={styles.secondary}
      disabled={video === 'recording'}
      onClick={onRecord}
    >
      {video === 'recording'
        ? 'Gravando vídeo…'
        : video === 'failed'
          ? 'Tentar gerar o vídeo de novo'
          : 'Gerar vídeo animado'}
    </button>
  );
}
