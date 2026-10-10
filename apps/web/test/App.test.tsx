import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { domAnimation, LazyMotion } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { resultsResponse, tally } from './fixtures';

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LazyMotion features={domAnimation}>
        <App />
      </LazyMotion>
    </QueryClientProvider>,
  );
}

function mockFetch(response: Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => response),
  );
}

beforeEach(() => {
  window.location.hash = '';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('shows the national scoreboard with both finalists', async () => {
    mockFetch(Response.json(resultsResponse()));
    renderApp();

    const scoreboard = await screen.findByRole('region', { name: 'Brasil' });
    expect(within(scoreboard).getByText('Lula')).toBeInTheDocument();
    expect(within(scoreboard).getByText('Flávio Bolsonaro')).toBeInTheDocument();
    expect(within(scoreboard).getByText('50,82%')).toBeInTheDocument();
    expect(within(scoreboard).getByText('Lidera')).toBeInTheDocument();
  });

  it('switches the result to a state picked in the list', async () => {
    mockFetch(Response.json(resultsResponse()));
    renderApp();

    const list = await screen.findByRole('list');
    await userEvent.click(within(list).getByRole('button', { name: /Bahia/ }));
    const scoreboard = await screen.findByRole('region', { name: 'Bahia' });
    // The share counts up from the national figure.
    expect(
      await within(scoreboard).findByText('70,00%', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('#/ba');
    expect(within(scoreboard).getByRole('button', { name: 'Nordeste' })).toBeInTheDocument();
  });

  it('counts the states each finalist leads in a region', async () => {
    window.location.hash = '#/regiao/ne';
    mockFetch(Response.json(resultsResponse()));
    renderApp();

    const scoreboard = await screen.findByRole('region', { name: 'Região Nordeste' });
    expect(within(scoreboard).getByText('Lidera mais')).toBeInTheDocument();
    // Lula leads all nine states: his count and the region's size.
    expect(within(scoreboard).getAllByText('9')).toHaveLength(2);
  });

  it('warns when serving stale data', async () => {
    mockFetch(Response.json(resultsResponse({ stale: true })));
    renderApp();
    expect(await screen.findByText(/O TSE não respondeu agora/)).toBeInTheDocument();
  });

  it('offers a retry when results cannot be loaded', async () => {
    mockFetch(new Response(null, { status: 503 }));
    renderApp();
    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});

describe('App abroad votes', () => {
  it('shows abroad results from the scope picker', async () => {
    mockFetch(Response.json(resultsResponse()));
    renderApp();

    await userEvent.click(await screen.findByRole('button', { name: 'Exterior' }));
    const scoreboard = await screen.findByRole('region', { name: 'Exterior' });
    expect(
      await within(scoreboard).findByText('66,67%', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('#/exterior');
  });

  it('selects abroad from its button on the map', async () => {
    mockFetch(Response.json(resultsResponse()));
    renderApp();

    await userEvent.click(await screen.findByRole('button', { name: /^Exterior: Flávio/ }));
    expect(window.location.hash).toBe('#/exterior');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('App rounds', () => {
  const runoffNotStarted = resultsResponse({
    round: 2,
    country: tally({ kind: 'country' }, 0, 0, 0),
  });
  const firstRound = resultsResponse({ round: 1 });

  function mockRounds() {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        Response.json(url.includes('round=1') ? firstRound : runoffNotStarted),
      ),
    );
  }

  it('opens on the first round while the runoff count has not started', async () => {
    mockRounds();
    renderApp();

    expect(await screen.findByRole('tab', { name: /1º turno/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Resultado final')).toBeInTheDocument();
  });

  it('switches to the runoff tab and keeps it in the URL', async () => {
    mockRounds();
    renderApp();

    await userEvent.click(await screen.findByRole('tab', { name: /2º turno/ }));
    expect(window.location.hash).toBe('#/2turno');
    expect(
      await screen.findByRole('heading', { name: 'A apuração começa às 17h' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
  });

  it('leads from the runoff countdown back to the first round', async () => {
    window.location.hash = '#/2turno';
    mockRounds();
    renderApp();

    await userEvent.click(
      await screen.findByRole('button', { name: /Ver o resultado do 1º turno/ }),
    );
    expect(window.location.hash).toBe('#/1turno');
  });
});
