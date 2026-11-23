import { getBuilding, getExhibit } from '../content/exhibits';
import { canRunArena, type Env } from './capability';
import type { Route } from './routeWords';

export type { Route } from './routeWords';

const AUTO: Route = { view: 'auto' };

export function parseRoute(hash: string): Route {
  let h: string;
  try {
    h = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return AUTO;
  }
  if (h === '' || h === '/') return AUTO;
  if (h === '/world') return { view: 'world' };
  if (h === '/box-score') return { view: 'boxscore' };
  if (h === '/arena') return { view: 'building', id: 'gym', legacy: true };
  if (h.startsWith('/b/')) {
    const b = getBuilding(h.slice(3));
    if (!b) return AUTO;
    if (b.kind === 'overlay') return { view: 'boxscore' };
    return { view: 'building', id: b.id, legacy: false };
  }
  if (h.startsWith('/')) return AUTO;
  return getExhibit(h) ? { view: 'exhibit', id: h } : AUTO;
}

export function resolveScreen(r: Route, env: Env): 'boxscore' | 'world' {
  switch (r.view) {
    case 'boxscore':
      return 'boxscore';
    case 'world':
    case 'building':
      return env.webgl ? 'world' : 'boxscore';
    default:
      return canRunArena(env) ? 'world' : 'boxscore';
  }
}

export function needsStartScreen(r: Route, started: boolean): boolean {
  return !started && (r.view === 'auto' || r.view === 'world');
}

export function hashForRoute(r: Route): string {
  switch (r.view) {
    case 'auto': return '#/';
    case 'boxscore': return '#/box-score';
    case 'world': return '#/world';
    case 'building': return `#/b/${r.id}`;
    case 'exhibit': return `#${r.id}`;
  }
}
