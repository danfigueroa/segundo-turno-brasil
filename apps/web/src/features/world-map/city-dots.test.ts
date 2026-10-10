import { describe, expect, it } from 'vitest';
import { abroadResponse, resultsResponse } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { cityDots, cityLead, labeledDots } from './city-dots';
import { WORLD_MAP } from './world-map';

const finalists = finalistsOf(resultsResponse().country);
const { cities } = abroadResponse();
const [atlanta] = cities;
if (!atlanta) throw new Error('fixture without cities');

describe('cityLead', () => {
  it('measures the margin against all valid votes of the city', () => {
    const city = { ...atlanta, votes: { '13': 30, '22': 60, '55': 10 } };
    const lead = cityLead(city, finalists);
    expect(lead?.leader.number).toBe('22');
    expect(lead?.margin).toBeCloseTo(30);
    expect(lead?.intensity).toBe(5);
  });

  it('has no leader before any vote or on a tie', () => {
    expect(cityLead({ ...atlanta, votes: {} }, finalists)).toBeUndefined();
    expect(cityLead({ ...atlanta, votes: { '13': 2, '22': 2 } }, finalists)).toBeUndefined();
  });
});

describe('cityDots', () => {
  it('sizes dots by electorate and draws the biggest first', () => {
    const sized = cities.map((c, i) => ({ ...c, electorate: [100, 400, 25, 1][i] ?? 1 }));
    const dots = cityDots(sized, finalists, WORLD_MAP.projection);
    expect(dots.map((d) => d.name)).toEqual(['Miami', 'Atlanta', 'Lisboa', 'Porto Príncipe']);
    expect(dots[0]?.r).toBe(16);
    expect(dots[1]?.r).toBe(8);
    expect(dots[3]?.r).toBe(3);
  });

  it('places cities where they are: Lisboa east of Miami and north of it', () => {
    const dots = cityDots(cities, finalists, WORLD_MAP.projection);
    const lisbon = dots.find((d) => d.name === 'Lisboa');
    const miami = dots.find((d) => d.name === 'Miami');
    expect(lisbon?.x).toBeGreaterThan(miami?.x ?? Infinity);
    expect(lisbon?.y).toBeLessThan(miami?.y ?? -Infinity);
  });
});

describe('labeledDots', () => {
  it('skips cities too close to one already labeled', () => {
    const sized = cities.map((c) => ({ ...c, electorate: c.name === 'MIAMI' ? 5000 : 1000 }));
    const dots = cityDots(sized, finalists, WORLD_MAP.projection);
    // Atlanta and Porto Príncipe are close to Miami, the biggest: only Miami gets a label.
    expect(labeledDots(dots, 6).map((d) => d.name)).toEqual(['Miami', 'Lisboa']);
  });
});
