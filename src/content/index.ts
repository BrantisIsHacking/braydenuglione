import { profile } from './profile';
import { stations } from './stations';
import { banners } from './banners';
import { interests } from './interests';
import { buildings } from './buildings';
import { mirrors } from './mirrors';
import { artists } from './artists';
import { books } from './books';
import { films } from './films';
import { games } from './games';
import { teams } from './teams';
import type { Category, Station } from './types';

export * from './types';
export { profile, stations, banners, interests };
export * from './buildings';
export * from './exhibits';
export * from './collections';

export const PHONE_PATTERN = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/;

export function getStation(id: string): Station | undefined {
  return stations.find((s) => s.id === id);
}

export function stationsByCategory(c: Category | 'all'): Station[] {
  return c === 'all' ? [...stations] : stations.filter((s) => s.category === c);
}

function collectStrings(v: unknown, out: string[]): void {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectStrings(x, out));
}

const strings: string[] = [];
collectStrings([profile, stations, banners, interests, buildings, mirrors, books, films, games, artists, teams], strings);
export const ALL_TEXT: string = strings.join('\n');
