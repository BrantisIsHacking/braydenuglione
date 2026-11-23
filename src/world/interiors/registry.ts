import type { BuildingId } from '../../content/types';
import type { Scene, SceneModule } from '../types';

export const interiorLoaders: Partial<Record<BuildingId, () => Promise<SceneModule>>> = {
  gym: () => import('./gym/Interior'),
};

const cache = new Map<string, Promise<SceneModule>>();

function key(s: Scene): string {
  return s.kind === 'world' ? 'world' : `interior:${s.id}`;
}

export function loadScene(s: Scene): Promise<SceneModule> {
  const k = key(s);
  const hit = cache.get(k);
  if (hit) return hit;
  const load = s.kind === 'world' ? () => import('../world/WorldScene') : (interiorLoaders[s.id] ?? (() => import('./generic/Interior')));
  const p: Promise<SceneModule> = Promise.resolve().then(load);
  cache.set(k, p);
  p.catch(() => {
    if (cache.get(k) === p) cache.delete(k);
  });
  return p;
}

export function prefetchScene(s: Scene): void {
  loadScene(s).catch(() => {});
}
