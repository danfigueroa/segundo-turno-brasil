import { historyResponseSchema, type HistoryResponse } from '@stb/contracts';
import { useQuery } from '@tanstack/react-query';
import type { Selection } from '../lib/selection';
import { ResultsUnavailableError } from './results';

/** `scope` parameter of `/api/history`: `br`, `zz`, `sp` or `regiao-ne`. */
export function historyScopeOf(selection: Selection): string {
  switch (selection.kind) {
    case 'country':
      return 'br';
    case 'abroad':
      return 'zz';
    case 'state':
      return selection.code.toLowerCase();
    case 'region':
      return `regiao-${selection.code.toLowerCase()}`;
  }
}

/** Fetches and validates the runoff count curve of one scope. */
export async function fetchHistory(scope: string, signal?: AbortSignal): Promise<HistoryResponse> {
  const response = await fetch(`/api/history?scope=${scope}`, {
    headers: { accept: 'application/json' },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new ResultsUnavailableError(response.status);
  return historyResponseSchema.parse(await response.json());
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
