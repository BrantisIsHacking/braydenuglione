export const REACH_M = 2;
/** Interiors: a visitor walking straight north from the hall entrance (slots at x = ±2, ±6) still gets a prompt. */
export const REACH_INTERIOR_M = 2.4;

export type Placed = { id: string; pos: [number, number]; focus?: string };

export function nearest(p: { x: number; z: number }, list: readonly Placed[]): { id: string; dist: number; focus?: string } | null {
  let best: { id: string; dist: number; focus?: string } | null = null;
  for (const s of list) {
    const dist = Math.hypot(s.pos[0] - p.x, s.pos[1] - p.z);
    if (!best || dist < best.dist) best = s.focus === undefined ? { id: s.id, dist } : { id: s.id, dist, focus: s.focus };
  }
  return best;
}

export function inReach(dist: number, reach: number = REACH_M): boolean {
  return dist <= reach;
}
