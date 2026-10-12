import type { HistoryResponse } from '@stb/contracts';
import { rankCandidates } from '@stb/domain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resultsResponse, tally } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import type { Selection } from '../../lib/selection';
import Insights from './Insights';
import { resetLive } from './live-history';

const runoff = resultsResponse();
const finalists = finalistsOf(runoff.country);

/** First round with a third candidate, where Flávio led in Bahia. */
const firstRound = (() => {
  const base = resultsResponse({ round: 1 });
  const withThird = (t: ReturnType<typeof tally>) => ({
    ...t,
    candidates: rankCandidates([
      ...t.candidates,
      { number: '15', name: 'TERCEIRO', party: 'P15', votes: 100 },
    ]),
  });
  return {
    ...base,
    country: withThird(tally({ kind: 'country' }, 9_000, 10_000, 100)),
    states: { ...base.states, BA: withThird(tally({ kind: 'state', code: 'BA' }, 300, 600, 100)) },
  };
})();

const history: HistoryResponse = {
  scope: { kind: 'country' },
  points: [
    {
      at: '2026-10-25T17:10:00-03:00',
      counted: 10,
      total: 100,
      votes: { '13': 3_000, '22': 2_000 },
    },
    {
      at: '2026-10-25T17:30:00-03:00',
      counted: 30,
      total: 100,
      votes: { '13': 7_000, '22': 7_400 },
    },
  ],
  fetchedAt: '2026-10-25T20:40:00.000Z',
  stale: false,
};

function renderInsights(
  props: { round?: 1 | 2; selection?: Selection; onSelect?: () => void } = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Insights
        round={props.round ?? 2}
        runoff={runoff}
        firstRound={firstRound}
        selection={props.selection ?? { kind: 'country' }}
        finalists={finalists}
        onSelect={props.onSelect ?? vi.fn()}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(history)),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetLive();
});

describe('Insights', () => {
  it('says whether the race can still turn around', () => {
    renderInsights();
    const card = screen.getByRole('region', { name: 'Ainda dá virada?' });
    // 400 ahead with at most 200 voters left in the fixture.
    expect(within(card).getByText('Decidido')).toBeInTheDocument();
    expect(within(card).getByText('Não, já está decidido')).toBeInTheDocument();
    expect(within(card).getByText('Vantagem de Flávio')).toBeInTheDocument();
  });

  it('plots the recorded and live count curve with the lead change', async () => {
    renderInsights();
    const card = screen.getByRole('region', { name: 'Como a apuração evoluiu' });
    const chart = await within(card).findByRole('img', {
      name: /Flávio passou à frente com 30% apurado/,
    });
    expect(chart).toHaveAccessibleName(/com 50% das seções apuradas/);
    expect(fetch).toHaveBeenCalledWith('/api/history?scope=br', expect.anything());
    expect(within(card).getByText('Ritmo')).toBeInTheDocument();
  });

  it('shows where the lead comes from and selects a state', async () => {
    const onSelect = vi.fn();
    renderInsights({ onSelect });
    const card = screen.getByRole('region', { name: 'De onde vem a vantagem' });
    expect(within(card).getByText(/Saldo total/)).toHaveTextContent(
      'Saldo total: Flávio +10 votos',
    );
    await userEvent.click(within(card).getByRole('button', { name: 'Bahia: Lula +400 votos' }));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'state', code: 'BA' });
    await userEvent.click(within(card).getByRole('button', { name: 'Ver todos os 28' }));
    expect(
      within(card).getByRole('button', { name: 'Exterior: Flávio +10 votos' }),
    ).toBeInTheDocument();
  });

  it('compares with the 2022 runoff by ballot number', async () => {
    const onSelect = vi.fn();
    renderInsights({ onSelect });
    const card = screen.getByRole('region', { name: 'Comparação com 2022' });
    expect(
      within(card).getByText(/Em 2022, com 50,00% das seções apuradas, Lula tinha/),
    ).toBeInTheDocument();
    await userEvent.click(within(card).getByRole('button', { name: /^MG/ }));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'state', code: 'MG' });
  });

  it('compares with the first round and lists flipped states', () => {
    renderInsights();
    const card = screen.getByRole('region', { name: 'Do 1º para o 2º turno' });
    expect(within(card).getByRole('button', { name: /BA.*Bahia/ })).toBeInTheDocument();
    expect(within(card).getByText(/Parcial do 2º turno: 50,00%/)).toBeInTheDocument();
  });

  it('shows only where the lead came from in the first round', () => {
    renderInsights({ round: 1 });
    expect(screen.getByRole('region', { name: 'De onde vem a vantagem' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Ainda dá virada?' })).not.toBeInTheDocument();
  });
});
