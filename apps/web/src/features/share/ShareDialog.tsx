import { useEffect, useRef, useState } from 'react';
import { renderShareImage, type ShareFormat } from './render-share-image';
import type { ShareContent } from './share-content';
import { canShareFile, canvasToFile, downloadFile, shareFile } from './share-file';
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

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let previewUrl: string | undefined;
    const fileName = `apuracao-2026-${content.title.toLowerCase().replace(/\s+/g, '-')}.png`;

    canvasToFile(renderShareImage(content, format), fileName)
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
    };
  }, [content, format]);

  const text = `Apuração do 2º turno em ${content.title}: acompanhe ao vivo em ${content.siteUrl}`;

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
      </div>
    </dialog>
  );
}
