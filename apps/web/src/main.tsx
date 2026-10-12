import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

const queryClient = new QueryClient();

// Page views are not needed for the first paint: their script loads after it.
const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((module) => ({ default: module.Analytics })),
);

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
    {/* Cookieless page views; only reports once deployed on Vercel. */}
    <Suspense fallback={null}>
      <Analytics />
    </Suspense>
  </StrictMode>,
);
