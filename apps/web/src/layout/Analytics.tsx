import { lazy } from 'react';

/**
 * Cookieless page views (only reported once deployed on Vercel). Not needed for the first
 * paint: the script loads after it.
 */
export const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((module) => ({ default: module.Analytics })),
);
