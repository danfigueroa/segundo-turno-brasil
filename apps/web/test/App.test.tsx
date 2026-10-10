import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { domAnimation, LazyMotion } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { resultsResponse } from './fixtures';

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
    expect(within(scoreboard).getByText('Flavio Bolsonaro')).toBeInTheDocument();
    expect(within(scoreboard).getByText('50,82%')).toBeInTheDocument();
    expect(within(scoreboard).getByText('Lidera')).toBeInTheDocument();
  });

  it('switches the scoreboard to a state picked in the table', async () => {
    mockFetch(Response.json(resultsResponse()));
    renderApp();

    const table = await screen.findByRole('table');
    await userEvent.click(within(table).getByRole('button', { name: /Bahia/ }));
    const scoreboard = await screen.findByRole('region', { name: 'Bahia' });
    expect(within(scoreboard).getAllByText('70,00%')[0]).toBeInTheDocument();
    expect(window.location.hash).toBe('#/ba');
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
    expect(within(scoreboard).getAllByText('66,67%')[0]).toBeInTheDocument();
    expect(window.location.hash).toBe('#/exterior');
  });

  it('lists abroad votes in the table', async () => {
    mockFetch(Response.json(resultsResponse()));
    renderApp();

    const table = await screen.findByRole('table');
    expect(within(table).getByRole('button', { name: /Exterior/ })).toBeInTheDocument();
  });
});
