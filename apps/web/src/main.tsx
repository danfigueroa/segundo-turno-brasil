import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { I18nProvider } from './i18n/context';
import type { I18n } from './i18n/i18n';
import { loadI18n } from './i18n/load';
import { readStoredLocale, resolveLocale } from './i18n/resolve-locale';
import { Analytics } from './layout/Analytics';
import './styles/global.css';

// One retry, a few seconds later: every attempt is an edge request (ADR 0031), and the
// next poll tries again anyway.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, retryDelay: 5_000 } },
});

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

const render = (i18n: I18n) =>
  createRoot(root).render(
    <StrictMode>
      <I18nProvider initial={i18n}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </I18nProvider>
      {/* Cookieless page views; only reports once deployed on Vercel. */}
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
    </StrictMode>,
  );

// The language comes first, so the site never flashes Portuguese at who reads another one.
const locale = resolveLocale({
  search: window.location.search,
  stored: readStoredLocale(),
  languages: navigator.languages,
});
loadI18n(locale).then(render, () => loadI18n('pt-BR').then(render));
