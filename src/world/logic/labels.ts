import type { PlacedExhibit } from '../types';

/** Ids of the `n` exhibits nearest the player, by distance, ties by id. */
export function nearestIds(p: { x: number; z: number }, placed: readonly PlacedExhibit[], n = 6): string[] {
  return placed
    .map((e) => ({ id: e.id, d: Math.hypot(e.pos[0] - p.x, e.pos[1] - p.z) }))
    .sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, n)
    .map((e) => e.id);
}

