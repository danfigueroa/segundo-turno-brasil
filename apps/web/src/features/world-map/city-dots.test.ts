import { describe, expect, it } from 'vitest';
import { abroadResponse, resultsResponse } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { cityDots, labeledDots } from './city-dots';
import { WORLD_MAP } from './world-map';

const finalists = finalistsOf(resultsResponse().country);
const { cities } = abroadResponse();

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
    expect([lisbon?.continent, miami?.continent]).toEqual(['EU', 'AM']);
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
