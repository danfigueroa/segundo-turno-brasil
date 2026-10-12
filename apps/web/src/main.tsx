import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Analytics } from './layout/Analytics';
import './styles/global.css';

const queryClient = new QueryClient();

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
