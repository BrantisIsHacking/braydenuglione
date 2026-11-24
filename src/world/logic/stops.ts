import { collectionKeys } from '../../content/collections';
import type { CollectionId } from '../../content/types';
import type { PlacedExhibit, SceneGeometry } from '../types';
import { REACH_INTERIOR_M } from './proximity';

/** A scene geometry with builder-owned collection stops appended after its content placements. */
export function withStops(base: SceneGeometry, stops: readonly PlacedExhibit[]): SceneGeometry {
  return { ...base, exhibits: [...base.exhibits, ...stops] };
}

/** Index of the stop nearest the player within reach, or -1. */
export function hotStop(stops: readonly PlacedExhibit[], p: { x: number; z: number }, reach: number = REACH_INTERIOR_M): number {
  let best = -1;
  let bd = reach;
  stops.forEach((s, i) => {
    const d = Math.hypot(s.pos[0] - p.x, s.pos[1] - p.z);
    if (d <= bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

/** Collection keys that neither a stop focus nor an `extra` key (reachable another way) covers. */
export function uncovered(id: CollectionId, focuses: readonly (string | undefined)[], extra: readonly string[] = []): string[] {
  const have = new Set<string>([...extra, ...focuses.filter((f): f is string => f !== undefined)]);
  return collectionKeys(id).filter((k) => !have.has(k));
}
