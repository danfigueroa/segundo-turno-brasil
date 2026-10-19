import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { resultsResponse } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import type * as RenderShareImage from './render-share-image';
import { shareContentFrom } from './share-content';
import type * as ShareFile from './share-file';
import ShareDialog from './ShareDialog';

vi.mock('./render-share-image', async (importOriginal) => ({
  ...(await importOriginal<typeof RenderShareImage>()),
  loadShareFonts: async () => undefined,
  renderShareImage: () => document.createElement('canvas'),
}));

vi.mock('./share-file', async (importOriginal) => ({
  ...(await importOriginal<typeof ShareFile>()),
  canvasToFile: async () => new File(['png'], 'x.png', { type: 'image/png' }),
  canShareFile: () => true,
  shareFile: async () => {
    throw new DOMException('denied', 'NotAllowedError');
  },
}));

vi.mock('./encode-share-video', () => ({
  canMakeVideo: () => false,
  makeShareVideo: vi.fn(),
}));

const data = resultsResponse();
const selection = { kind: 'state', code: 'BA' } as const;
const content = shareContentFrom(data, selection, finalistsOf(data.country), 'x');

beforeAll(() => {
  URL.createObjectURL ??= () => 'blob:share';
  URL.revokeObjectURL ??= () => undefined;
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
});

describe('ShareDialog', () => {
  it('points to the download when the share sheet fails', async () => {
    render(<ShareDialog content={content} selection={selection} onClose={() => undefined} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Não foi possível abrir o compartilhamento. Use Baixar.',
    );
  });
});
