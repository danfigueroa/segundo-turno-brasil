import { describe, expect, it } from 'vitest';
import { resultsResponse, tally } from '../../test/fixtures';
import { finalistsOf } from './finalists';
import { stateLeads } from './state-leads';

describe('stateLeads', () => {
  const data = resultsResponse();
  const finalists = finalistsOf(data.country);

  it('counts the states each finalist leads', () => {
    const leads = stateLeads(data, finalists, ['BA', 'CE', 'SP']);
    expect(leads.counts).toEqual({ '13': 2, '22': 1 });
    expect(leads.undecided).toBe(0);
  });

  it('finds the widest margin', () => {
    const states = { ...data.states, CE: tally({ kind: 'state', code: 'CE' }, 900, 100) };
    const leads = stateLeads({ ...data, states }, finalists, ['BA', 'CE', 'SP']);
    expect(leads.widest?.code).toBe('CE');
    expect(leads.widest?.lead.margin).toBeCloseTo(80);
  });

  it('leaves states without votes undecided', () => {
    const states = { ...data.states, SP: tally({ kind: 'state', code: 'SP' }, 0, 0, 0) };
    const leads = stateLeads({ ...data, states }, finalists, ['SP']);
    expect(leads).toEqual({ counts: { '13': 0, '22': 0 }, undecided: 1, widest: undefined });
  });
});
