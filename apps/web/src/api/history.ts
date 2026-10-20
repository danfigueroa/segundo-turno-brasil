import { historyResponseSchema, type HistoryResponse } from '@stb/contracts';
import { useQuery } from '@tanstack/react-query';
import type { Selection } from '../lib/selection';
import { createJsonFetcher } from './fetch-json';

/** `scope` parameter of `/api/history`: `br`, `zz`, `sp` or `regiao-ne`. */
export function historyScopeOf(selection: Selection): string {
  switch (selection.kind) {
    case 'country':
      return 'br';
    // No history per country abroad: a country follows abroad.
    case 'abroad':
    case 'abroadCountry':
      return 'zz';
    case 'state':
      return selection.code.toLowerCase();
    case 'region':
      return `regiao-${selection.code.toLowerCase()}`;
    // No history per municipality: a city follows its state.
    case 'city':
      return selection.state.toLowerCase();
  }
}

const getHistory = createJsonFetcher((value) => historyResponseSchema.parse(value));

/** Fetches and validates the runoff count curve of one scope. */
export function fetchHistory(scope: string, signal?: AbortSignal): Promise<HistoryResponse> {
  return getHistory(`/api/history?scope=${scope}`, signal);
}

/**
 * The count curve recorded before the page was opened. Fetched once per scope: newer
 * points come from the results polling (ADR 0011).
 */
export function useHistory(selection: Selection, { enabled = true } = {}) {
  const scope = historyScopeOf(selection);
  return useQuery({
    queryKey: ['history', scope],
    queryFn: ({ signal }) => fetchHistory(scope, signal),
    enabled,
    staleTime: Infinity,
  });
}
