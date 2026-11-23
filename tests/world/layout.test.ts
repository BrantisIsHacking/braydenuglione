import { describe, it, expect } from 'vitest';
import { buildings } from '../../src/content/buildings';
import { NORTH, SOUTH, SPAWN_POSE, type Rect } from '../../src/world/types';
import {
  MAP, LOTS, FOUNTAIN, DOOR_W, doorTrigger, exitPose, spotPose, worldColliders, worldDoors, reachable, E2E_LANES,
} from '../../src/world/logic/layout';

const hit = (a: Rect, b: Rect) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;
const circleHits = (x: number, z: number, r: number, c: Rect) => {
  const dx = Math.max(Math.abs(x - c.x) - c.w / 2, 0), dz = Math.max(Math.abs(z - c.z) - c.d / 2, 0);
  return dx * dx + dz * dz < r * r;
};
const kind = (id: string) => buildings.find((b) => b.id === id)!.kind;
const lots = Object.values(LOTS);
const doored = lots.filter((l) => l.door);

describe('lots', () => {
  it('covers all 18 building ids', () => {
    expect(Object.keys(LOTS).sort()).toEqual(buildings.map((b) => b.id).sort());
    expect(Object.keys(LOTS)).toHaveLength(18);
  });
  it('doors for interior/overlay, spots for spots', () => {
    for (const l of lots) {
      if (kind(l.id) === 'spot') { expect(l.spot).not.toBeNull(); expect(l.door).toBeNull(); }
      else { expect(l.door).not.toBeNull(); expect(l.spot).toBeNull(); }
    }
  });
  it('doors on the south face', () => {
    for (const l of doored) {
      expect(l.door!.z).toBeCloseTo(l.rect.z + l.rect.d / 2);
      expect(Math.abs(l.door!.x - l.rect.x)).toBeLessThanOrEqual(l.rect.w / 2 - DOOR_W / 2 + 1e-9);
    }
  });
  it('doors spaced and near enough', () => {
    for (const a of doored) for (const b of doored) if (a !== b) {
      expect(Math.hypot(a.door!.x - b.door!.x, a.door!.z - b.door!.z)).toBeGreaterThanOrEqual(8);
    }
    for (const l of doored) {
      const d = Math.hypot(l.door!.x - SPAWN_POSE.x, l.door!.z - SPAWN_POSE.z);
      expect(d).toBeGreaterThan(6);
      expect(d).toBeLessThanOrEqual(42);
    }
  });
  it('rects inside MAP with margin', () => {
    for (const l of lots) {
      expect(l.rect.x - l.rect.w / 2).toBeGreaterThanOrEqual(MAP.minX + 3);
      expect(l.rect.x + l.rect.w / 2).toBeLessThanOrEqual(MAP.maxX - 3);
      expect(l.rect.z - l.rect.d / 2).toBeGreaterThanOrEqual(MAP.minZ + 3);
      expect(l.rect.z + l.rect.d / 2).toBeLessThanOrEqual(MAP.maxZ - 3);
    }
  });
  it('colliders do not overlap each other or spawn', () => {
    const cs = worldColliders();
    expect(cs).toHaveLength(19);
    expect(cs).toContainEqual(FOUNTAIN);
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) expect(hit(cs[i], cs[j])).toBe(false);
      expect(circleHits(SPAWN_POSE.x, SPAWN_POSE.z, 1, cs[i])).toBe(false);
    }
  });
});

describe('e2e lanes', () => {
  it('are clear of colliders', () => {
    for (const lane of E2E_LANES) for (const c of worldColliders()) expect(hit(lane, c)).toBe(false);
  });
  it('only the far ends touch the Gym and Scouting Office triggers', () => {
    // The lane's outer 0.7 m is slack; the walked core (player-wide strip along the long axis) is what must stay clear.
    const core = (l: Rect): Rect => (l.w >= l.d ? { ...l, d: 0.8 } : { ...l, w: 0.8 });
    for (const lane of E2E_LANES) for (const t of worldDoors()) {
      if (hit(core(lane), t.rect)) expect(['gym', 'scouting-office']).toContain(t.id);
    }
    for (const id of ['gym', 'scouting-office'] as const) {
      expect(E2E_LANES.some((l) => hit(l, doorTrigger(LOTS[id])))).toBe(true);
    }
  });
});

describe('doors and exits (RF1)', () => {
  it('doorTrigger geometry', () => {
    const t = doorTrigger(LOTS.gym);
    expect(t).toEqual({ x: 20, z: -7 + 0.45, w: 2.4, d: 0.9 });
  });
  it('worldDoors lists interior and overlay lots', () => {
    expect(worldDoors().map((d) => d.id).sort()).toEqual(buildings.filter((b) => b.kind !== 'spot').map((b) => b.id).sort());
  });
  it('exit poses are inside MAP, clear of colliders and triggers', () => {
    const trig = worldDoors();
    for (const id of Object.keys(LOTS) as (keyof typeof LOTS)[]) {
      const p = exitPose(id);
      expect(p.x).toBeGreaterThan(MAP.minX); expect(p.x).toBeLessThan(MAP.maxX);
      expect(p.z).toBeGreaterThan(MAP.minZ); expect(p.z).toBeLessThan(MAP.maxZ);
      for (const c of worldColliders()) expect(circleHits(p.x, p.z, 0.4, c)).toBe(false);
      for (const t of trig) expect(circleHits(p.x, p.z, 0, t.rect) || hit({ x: p.x, z: p.z, w: 0, d: 0 }, t.rect)).toBe(false);
    }
    expect(exitPose('gym')).toEqual({ x: 20, z: -5.5, heading: SOUTH });
    expect(spotPose('chess-park')).toEqual({ x: 22, z: 4 + 0.6 + 1.5, heading: NORTH });
    expect(exitPose('park')).toEqual(spotPose('park'));
  });
});

describe('reachable', () => {
  it('every door and spot is reachable from spawn', () => {
    const targets = [
      ...worldDoors().map((d) => ({ x: d.rect.x, z: d.rect.z })),
      ...(Object.keys(LOTS) as (keyof typeof LOTS)[]).filter((id) => LOTS[id].spot).map((id) => spotPose(id)),
    ];
    expect(targets.length).toBe(18);
    expect(reachable(SPAWN_POSE, targets, worldColliders(), MAP).every(Boolean)).toBe(true);
  });
  it('a walled-in target is unreachable', () => {
    const walls: Rect[] = [
      { x: 30, z: 30 - 3, w: 8, d: 1 }, { x: 30, z: 30 + 3, w: 8, d: 1 },
      { x: 30 - 3, z: 30, w: 1, d: 8 }, { x: 30 + 3, z: 30, w: 1, d: 8 },
    ];
    const r = reachable(SPAWN_POSE, [{ x: 30, z: 30 }, { x: 10, z: 10 }], walls, MAP);
    expect(r).toEqual([false, true]);
  });
});
