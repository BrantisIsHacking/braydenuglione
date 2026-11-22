import { getStation } from '../content';

export type Route = { view: 'boxscore'; stationId: string | null };

export function parseHash(hash: string): Route {
  const id = hash.replace(/^#/, '');
  return { view: 'boxscore', stationId: id && getStation(id) ? id : null };
}

export function toHash(stationId: string): string {
  return `#${stationId}`;
}
