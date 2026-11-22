import { REACH_M } from './court';

export type Placed = { id: string; pos: [number, number] };

export function nearest(p: { x: number; z: number }, list: readonly Placed[]): { id: string; dist: number } | null {
  let best: { id: string; dist: number } | null = null;
  for (const s of list) {
    const dist = Math.hypot(s.pos[0] - p.x, s.pos[1] - p.z);
    if (!best || dist < best.dist) best = { id: s.id, dist };
  }
  return best;
}

export function inReach(dist: number): boolean {
  return dist <= REACH_M;
}
