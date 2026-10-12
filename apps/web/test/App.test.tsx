import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { abroadResponse, citiesResponse, resultsResponse, tally } from './fixtures';

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

/** Answers `/api/results`, `/api/abroad` and `/api/cities`; each call gets a fresh `Response`. */
function mockFetch(results: () => Response, abroad = () => Response.json(abroadResponse())) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.includes('/api/abroad')
        ? abroad()
        : url.includes('/api/cities')
          ? Response.json(citiesResponse())
          : results(),
    ),
  );
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.location.hash = '';
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('shows the national scoreboard with both finalists', async () => {
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const scoreboard = await screen.findByRole('region', { name: 'Brasil' });
    expect(within(scoreboard).getByText('Lula')).toBeInTheDocument();
    expect(within(scoreboard).getByText('Flávio Bolsonaro')).toBeInTheDocument();
    expect(within(scoreboard).getByText('50,82%')).toBeInTheDocument();
    expect(within(scoreboard).getByText('Lidera')).toBeInTheDocument();
  });

  it('puts the score of the scope on screen in the tab title', async () => {
    window.location.hash = '#/ba';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    await screen.findByRole('region', { name: 'Bahia' });
    expect(document.title).toBe('Bahia: Lula 70,00% × 30,00% Flávio · 50,00% apurado');
  });

  it('offers to share the victory once the race is decided', async () => {
    mockFetch(() =>
      Response.json(resultsResponse({ country: tally({ kind: 'country' }, 550, 250, 80) })),
    );
    renderApp();
    expect(
      await screen.findByRole('button', { name: 'Compartilhar a vitória de Lula' }),
    ).toBeInTheDocument();
  });

  it("pins a state as the viewer's and offers it first in the chips", async () => {
    window.location.hash = '#/ba';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const pin = await screen.findByRole('button', { name: 'Fixar como meu estado' });
    await userEvent.click(pin);
    expect(pin).toHaveAccessibleName('Fixado como meu estado');
    expect(pin).toHaveAttribute('aria-pressed', 'true');

    const chips = screen.getByRole('group', { name: 'Ver resultado de' });
    await userEvent.click(within(chips).getByRole('button', { name: 'Brasil' }));
    await userEvent.click(within(chips).getByRole('button', { name: 'Bahia' }));
    expect(window.location.hash).toBe('#/ba');
  });

  it('switches the map to abstention by state', async () => {
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    await userEvent.click(await screen.findByRole('button', { name: 'Abstenção' }));
    expect(screen.getByRole('heading', { name: 'Abstenção em cada estado' })).toBeInTheDocument();
    // Fixture states: 800 of 1000 voters showed up.
    expect(screen.getByRole('button', { name: /^Bahia: abstenção de 20,00%/ })).toHaveAttribute(
      'data-hue',
      'abstention',
    );
    expect(screen.getByText('Abstenção nas seções apuradas (%)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Quem lidera' }));
    expect(screen.getByRole('button', { name: /^Bahia: Lula lidera/ })).toHaveAttribute(
      'data-hue',
      'red',
    );
  });

  it('shows only the result card with a link to the site when embedded', async () => {
    window.history.replaceState(null, '', '/?embed#/ba');
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const scoreboard = await screen.findByRole('region', { name: 'Bahia' });
    expect(within(scoreboard).getByText('70,00%')).toBeInTheDocument();
    expect(within(scoreboard).getByRole('link', { name: /Acompanhe ao vivo em/ })).toHaveAttribute(
      'href',
      'https://eleicao.danielfigueroa.dev/#/ba',
    );
    expect(screen.queryByRole('heading', { name: 'Quem lidera em cada estado' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Ver resultado de' })).toBeNull();
  });

  it('switches the result to a state picked in the list', async () => {
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const list = await screen.findByRole('region', { name: 'Resultado por estado' });
    await userEvent.click(within(list).getByRole('button', { name: /Bahia/ }));
    const scoreboard = await screen.findByRole('region', { name: 'Bahia' });
    expect(within(scoreboard).getByText('70,00%')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/ba');
    expect(within(scoreboard).getByRole('button', { name: 'Nordeste' })).toBeInTheDocument();
  });

  it('shows shares, votes and states won in a region', async () => {
    window.location.hash = '#/regiao/ne';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const scoreboard = await screen.findByRole('region', { name: 'Região Nordeste' });
    expect(within(scoreboard).getByText('70,00%')).toBeInTheDocument();
    expect(within(scoreboard).getByText('PT · 6.300 votos')).toBeInTheDocument();
    expect(within(scoreboard).getByText('Lidera em 9 estados')).toBeInTheDocument();
  });

  it('credits the developer in the footer', async () => {
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();
    expect(await screen.findByRole('link', { name: '@danmfigueroa' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/danmfigueroa/',
    );
  });

  it('warns when serving stale data', async () => {
    mockFetch(() => Response.json(resultsResponse({ stale: true })));
    renderApp();
    expect(await screen.findByText(/O TSE não respondeu agora/)).toBeInTheDocument();
  });

  it('offers a retry when results cannot be loaded', async () => {
    mockFetch(() => new Response(null, { status: 503 }));
    renderApp();
    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});

describe('App abroad votes', () => {
  it('shows abroad results from the scope picker', async () => {
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    await userEvent.click(await screen.findByRole('button', { name: 'Exterior' }));
    const scoreboard = await screen.findByRole('region', { name: 'Exterior' });
    expect(within(scoreboard).getByText('66,67%')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/exterior');
  });

  it('lists the votes by country abroad', async () => {
    window.location.hash = '#/exterior';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const section = await screen.findByRole('region', { name: 'Votação por país' });
    expect(
      await within(section).findByText(
        /Lula lidera em 1 país, Flávio em 1 e houve 1 empate \(Haiti\)/,
      ),
    ).toBeInTheDocument();
    const rows = within(section).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Estados Unidos'),
      expect.stringContaining('Portugal'),
      expect.stringContaining('Haiti'),
    ]);

    await userEvent.type(within(section).getByRole('searchbox', { name: 'Buscar país' }), 'portu');
    expect(within(section).getAllByRole('listitem')).toHaveLength(1);
    await userEvent.click(within(section).getByRole('button', { name: 'Europa' }));
    await userEvent.clear(within(section).getByRole('searchbox'));
    expect(within(section).getAllByRole('listitem')).toHaveLength(1);

    const scoreboard = screen.getByRole('region', { name: 'Exterior' });
    expect(within(scoreboard).getByText('Países com votos')).toBeInTheDocument();
    expect(within(scoreboard).getByText('1 Lula · 1 Flávio')).toBeInTheDocument();
  });

  it('selects abroad from its button on the map', async () => {
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    await userEvent.click(await screen.findByRole('button', { name: /^Exterior: Flávio/ }));
    expect(window.location.hash).toBe('#/exterior');
    expect(screen.queryByRole('heading', { name: 'Resultado por estado' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Votação por país' })).toBeInTheDocument();
  });

  it('swaps the map of Brazil for a map of the countries of a continent', async () => {
    window.location.hash = '#/exterior';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Quem lidera em cada país' }),
    ).toBeInTheDocument();
    // Europe, with the most voters abroad, opens first.
    expect(
      await screen.findByRole('img', { name: /^Europa: Lula lidera em 1 país, .* em 0 países/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Estados' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Voltar ao Brasil' }));
    expect(window.location.hash).toBe('');
    expect(await screen.findByRole('group', { name: 'Estados' })).toBeInTheDocument();
  });

  it('switches the map to another continent', async () => {
    window.location.hash = '#/exterior';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const continents = await screen.findByRole('group', { name: 'Continente do mapa' });
    expect(within(continents).getByRole('button', { name: 'Europa' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(within(continents).getByRole('button', { name: 'Américas' }));
    expect(
      await screen.findByRole('img', { name: /^Américas: Lula lidera em 0 países, .* em 1 país/ }),
    ).toBeInTheDocument();
  });

  it('selects a country abroad from the list by country', async () => {
    window.location.hash = '#/exterior';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const section = await screen.findByRole('region', { name: 'Votação por país' });
    await userEvent.click(await within(section).findByRole('button', { name: /^Portugal/ }));
    expect(window.location.hash).toBe('#/exterior/portugal');
    expect(within(section).getByRole('button', { name: /^Portugal/ })).toHaveAttribute(
      'aria-current',
      'location',
    );

    const scoreboard = await screen.findByRole('region', { name: 'Portugal' });
    // Lula 6 × 3 Flávio among Brazilians in Portugal.
    expect(within(scoreboard).getByText('66,67%')).toBeInTheDocument();
    const crumbs = within(scoreboard).getByRole('navigation', { name: 'Você está em' });
    expect(
      within(crumbs)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Brasil', 'Exterior', 'Portugal']);
    expect(within(scoreboard).getByText('Seções apuradas')).toBeInTheDocument();
    expect(
      within(scoreboard).getByRole('button', { name: 'Compartilhar Portugal' }),
    ).toBeInTheDocument();
  });

  it('opens a country abroad from a link, on the map of its continent', async () => {
    window.location.hash = '#/exterior/estados-unidos';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    expect(await screen.findByRole('region', { name: 'Estados Unidos' })).toBeInTheDocument();
    const continents = await screen.findByRole('group', { name: 'Continente do mapa' });
    await waitFor(() =>
      expect(within(continents).getByRole('button', { name: 'Américas' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(
      screen.queryByRole('heading', { name: 'De onde vem a vantagem' }),
    ).not.toBeInTheDocument();
  });
});

describe('App cities', () => {
  it('lists the municipalities of a state in place of the states', async () => {
    window.location.hash = '#/ba';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const section = await screen.findByRole('region', { name: 'Votação por cidade' });
    expect(
      await within(section).findByText(
        'Lula lidera em 2 cidades, Flávio lidera em 1 cidade, de 3 cidades.',
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Quem lidera em cada cidade' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Resultado por estado|Outros estados/ }),
    ).not.toBeInTheDocument();

    await userEvent.type(
      within(section).getByRole('searchbox', { name: 'Buscar cidade em Bahia' }),
      'feira',
    );
    expect(within(section).getAllByRole('listitem')).toHaveLength(1);
  });

  it('ranks the municipalities by the widest lead', async () => {
    window.location.hash = '#/ba';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const section = await screen.findByRole('region', { name: 'Votação por cidade' });
    const names = () =>
      within(section)
        .getAllByRole('listitem')
        .map((item) => item.textContent?.match(/^[^\d]+/)?.[0]?.trim());
    await within(section).findByRole('button', { name: /Salvador/ });
    expect(names()).toEqual(['Salvador', 'Feira de Santana', 'Barreiras']);

    await userEvent.click(within(section).getByRole('button', { name: 'Maior vantagem' }));
    expect(names()).toEqual(['Barreiras', 'Salvador', 'Feira de Santana']);
  });

  it('opens the result card of a city picked in the list', async () => {
    window.location.hash = '#/ba';
    mockFetch(() => Response.json(resultsResponse()));
    renderApp();

    const section = await screen.findByRole('region', { name: 'Votação por cidade' });
    await userEvent.click(await within(section).findByRole('button', { name: /Salvador/ }));
    expect(window.location.hash).toBe('#/ba/2927408');
    const scoreboard = await screen.findByRole('region', { name: 'Salvador' });
    expect(within(scoreboard).getByText('70,00%')).toBeInTheDocument();
    expect(within(scoreboard).getByRole('button', { name: 'Bahia' })).toBeInTheDocument();
    expect(
      within(scoreboard).getByRole('button', { name: 'Compartilhar Salvador' }),
    ).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: /Salvador/ })).toHaveAttribute(
      'aria-current',
      'location',
    );
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
