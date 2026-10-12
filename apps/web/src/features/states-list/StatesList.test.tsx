import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { resultsResponse } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { prefetchStateMap } from '../state-map/state-maps';
import { StatesList } from './StatesList';

vi.mock('../state-map/state-maps', () => ({ prefetchStateMap: vi.fn() }));

const data = resultsResponse();
const finalists = finalistsOf(data.country);

describe('StatesList', () => {
  it('lists every state with the lead and toggles the full list', async () => {
    render(
      <StatesList
        data={data}
        finalists={finalists}
        selection={{ kind: 'country' }}
        onSelect={vi.fn()}
      />,
    );
    const bahia = screen.getByRole('button', { name: /Bahia/ });
    expect(within(bahia).getByText('Lula +40,0')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(27);

    const toggle = screen.getByRole('button', { name: 'Ver os 27 estados' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAccessibleName('Mostrar menos');
  });

  it('shows the region of the selected state', async () => {
    const onSelect = vi.fn();
    render(
      <StatesList
        data={data}
        finalists={finalists}
        selection={{ kind: 'state', code: 'SP' }}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Outros estados do Sudeste' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /São Paulo/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: /Minas Gerais/ }));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'state', code: 'MG' });
  });

  it('starts downloading the municipal map when a finger touches a state', async () => {
    render(
      <StatesList
        data={data}
        finalists={finalists}
        selection={{ kind: 'country' }}
        onSelect={vi.fn()}
      />,
    );
    await userEvent.pointer({
      keys: '[TouchA]',
      target: screen.getByRole('button', { name: /Bahia/ }),
    });
    expect(prefetchStateMap).toHaveBeenCalledWith('BA');
  });
});
