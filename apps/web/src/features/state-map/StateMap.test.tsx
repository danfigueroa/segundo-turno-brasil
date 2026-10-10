import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { citiesResponse, resultsResponse } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { loadStateMap } from './state-maps';
import StateMap from './StateMap';

const finalists = finalistsOf(resultsResponse().country);
const map = {
  viewBox: '0 0 10 10',
  cities: { '2927408': 'M0,0L1,1Z', '2903201': 'M2,2L3,3Z', '2900108': 'M4,4L5,5Z' },
};

describe('StateMap', () => {
  it('colors each municipality by its leader and selects it on tap', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <StateMap
        uf="BA"
        map={map}
        selection={{ kind: 'city', state: 'BA', ibge: '2927408' }}
        cities={citiesResponse().cities}
        finalists={finalists}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('img', { name: 'Mapa dos municípios de Bahia' })).toBeInTheDocument();
    const paths = [...container.querySelectorAll('path')];
    // The selected municipality is drawn last, on top of its neighbors.
    expect(paths.map((p) => [p.getAttribute('data-hue'), p.hasAttribute('data-selected')])).toEqual(
      [
        ['none', false],
        ['blue', false],
        ['red', true],
      ],
    );

    await userEvent.click(paths[1] as Element);
    expect(onSelect).toHaveBeenCalledWith({ kind: 'city', state: 'BA', ibge: '2903201' });
    // A shape with no results (2900108) is not selectable.
    await userEvent.click(paths[0] as Element);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('names the selected city on the map', () => {
    const { container } = render(
      <StateMap
        uf="BA"
        map={map}
        selection={{ kind: 'city', state: 'BA', ibge: '2927408' }}
        cities={citiesResponse().cities}
        finalists={finalists}
        onSelect={vi.fn()}
      />,
    );
    expect(container.querySelector('text')).toHaveTextContent('Salvador');
  });

  it('jumps to a city, or back to the whole state, from the city select', async () => {
    const onSelect = vi.fn();
    render(
      <StateMap
        uf="BA"
        map={map}
        selection={{ kind: 'city', state: 'BA', ibge: '2927408' }}
        cities={citiesResponse().cities}
        finalists={finalists}
        onSelect={onSelect}
      />,
    );
    const select = screen.getByLabelText('Ou escolha uma cidade');
    expect(select).toHaveValue('2927408');
    await userEvent.selectOptions(select, '2903201');
    expect(onSelect).toHaveBeenLastCalledWith({ kind: 'city', state: 'BA', ibge: '2903201' });
    await userEvent.selectOptions(select, '');
    expect(onSelect).toHaveBeenLastCalledWith({ kind: 'state', code: 'BA' });
  });

  it('disables the city select while the municipalities load', () => {
    render(
      <StateMap
        uf="BA"
        map={map}
        selection={{ kind: 'state', code: 'BA' }}
        cities={undefined}
        finalists={finalists}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Ou escolha uma cidade')).toBeDisabled();
    expect(screen.queryByText('Salvador')).not.toBeInTheDocument();
  });

  it('ships a municipal map for every state, keyed by IBGE code', async () => {
    const { cities } = await loadStateMap('BA');
    expect(Object.keys(cities)).toHaveLength(417);
    expect(cities['2927408']).toMatch(/^M/);
  });
});
