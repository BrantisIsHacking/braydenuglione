import { profile } from './profile';
import { stations } from './stations';
import { banners } from './banners';
import { lockerRoom } from './lockerRoom';
import type { Category, Station } from './types';

export * from './types';
export { profile, stations, banners, lockerRoom };

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
collectStrings([profile, stations, banners, lockerRoom], strings);
export const ALL_TEXT: string = strings.join('\n');
