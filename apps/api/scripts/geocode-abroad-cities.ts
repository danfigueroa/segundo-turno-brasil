/**
 * Looks up the coordinates of every city abroad on OpenStreetMap (Nominatim), for the
 * world map. Run once when the city list changes, review the output by hand (the
 * display name of each match is printed) and copy `lat`/`lon` into `abroad-cities.ts`.
 *
 *   pnpm --filter @stb/api geocode:abroad > coordinates.json
 */
import { ABROAD_CITIES } from '../src/adapters/tse/abroad-cities';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
/** Nominatim's usage policy allows one request per second. */
const DELAY_MS = 1100;

interface Match {
  lat: string;
  lon: string;
  display_name: string;
}

const round1 = (value: string) => Math.round(Number(value) * 10) / 10;

const coordinates: Record<string, { lat: number; lon: number; match: string }> = {};
for (const [code, { city, country }] of Object.entries(ABROAD_CITIES)) {
  const url = new URL(NOMINATIM);
  url.search = new URLSearchParams({
    q: `${city}, ${country}`,
    format: 'jsonv2',
    limit: '1',
    'accept-language': 'pt-BR',
  }).toString();
  const response = await fetch(url, {
    headers: { 'user-agent': 'segundo-turno-brasil (map build script)' },
  });
  const [match] = (await response.json()) as Match[];
  if (match) {
    coordinates[code] = {
      lat: round1(match.lat),
      lon: round1(match.lon),
      match: match.display_name,
    };
  } else {
    console.error(`No match for ${city}, ${country} (${code})`);
  }
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}
console.log(JSON.stringify(coordinates, null, 2));
