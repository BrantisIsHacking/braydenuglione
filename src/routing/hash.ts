import { getStation } from '../content';
import { canRunArena, type Env } from './capability';

export type Route = { view: 'auto' | 'boxscore' | 'arena'; stationId: string | null };

export function parseHash(hash: string): Route {
  if (hash === '#/box-score') return { view: 'boxscore', stationId: null };
  if (hash === '#/arena') return { view: 'arena', stationId: null };
  const id = hash.replace(/^#/, '');
  return { view: 'auto', stationId: id && getStation(id) ? id : null };
}

export function resolveView(r: Route, env: Env): 'boxscore' | 'arena' {
  if (r.view === 'boxscore') return 'boxscore';
  if (r.view === 'arena') return env.webgl ? 'arena' : 'boxscore';
  return canRunArena(env) ? 'arena' : 'boxscore';
}

export function toHash(stationId: string): string {
  return `#${stationId}`;
}
