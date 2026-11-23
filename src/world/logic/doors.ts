import type { Trigger } from '../types';

export const PREFETCH_RADIUS = 10;

type P = { x: number; z: number };

/** Id of the first trigger whose rect contains p (min inclusive, max exclusive). */
export function triggerAt(p: P, triggers: readonly Trigger[]): string | null {
  for (const t of triggers) {
    const { x, z, w, d } = t.rect;
    if (p.x >= x - w / 2 && p.x < x + w / 2 && p.z >= z - d / 2 && p.z < z + d / 2) return t.id;
  }
  return null;
}

export type DoorLatch = { update(id: string | null): string | null; reset(): void };

/** Fires only on an outside→inside transition; starts disarmed until it observes null. */
export function createDoorLatch(): DoorLatch {
  let armed = false;
  let prev: string | null = null;
  return {
    update(id) {
      const fire = armed && prev === null && id !== null;
      if (id === null) armed = true;
      prev = id;
      return fire ? id : null;
    },
    reset() { armed = false; prev = null; },
  };
}

/** Trigger ids whose rect centre is within radius of p, nearest first. */
export function within(p: P, triggers: readonly Trigger[], radius: number = PREFETCH_RADIUS): string[] {
  return triggers
    .map((t) => ({ id: t.id, d: Math.hypot(t.rect.x - p.x, t.rect.z - p.z) }))
    .filter((e) => e.d <= radius)
    .sort((a, b) => a.d - b.d)
    .map((e) => e.id);
}
