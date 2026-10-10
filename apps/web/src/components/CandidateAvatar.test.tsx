import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { resultsResponse } from '../../test/fixtures';
import { finalistsOf } from '../lib/finalists';
import { CandidateAvatar } from './CandidateAvatar';

const [lula] = finalistsOf(resultsResponse().country);

describe('CandidateAvatar', () => {
  it('shows the photo stored under the ballot number', () => {
    if (!lula) throw new Error('missing finalist');
    const { container } = render(<CandidateAvatar finalist={lula} />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/candidates/13.jpeg');
  });

  it('falls back to the initials without a photo', () => {
    if (!lula) throw new Error('missing finalist');
    const { container } = render(<CandidateAvatar finalist={lula} />);
    const img = container.querySelector('img');
    if (img) fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('L');
  });
});
