import { describe, it, expect } from 'vitest';
import { spawnFor } from '../../src/arena/logic/spawn';
import { nearest } from '../../src/arena/logic/proximity';
import { SPAWN, PLAY_BOUNDS } from '../../src/arena/logic/court';
import { stations } from '../../src/content/stations';

describe('spawnFor', () => {
  it('null is SPAWN', () => expect(spawnFor(null)).toEqual(SPAWN));
  it('origin-adjacent station', () => {
    const p = spawnFor({ id: 'x', pos: [0, 0] });
    expect(p).toEqual({ x: -1.5, z: 0, heading: 0 });
  });
  for (const s of stations) {
    it(`station ${s.id}`, () => {
      const p = spawnFor(s as any);
      const [sx, sz] = s.pos as [number, number];
      expect(p.x).toBeGreaterThanOrEqual(PLAY_BOUNDS.minX);
      expect(p.x).toBeLessThanOrEqual(PLAY_BOUNDS.maxX);
      expect(p.z).toBeGreaterThanOrEqual(PLAY_BOUNDS.minZ);
      expect(p.z).toBeLessThanOrEqual(PLAY_BOUNDS.maxZ);
      const d = Math.hypot(sx - p.x, sz - p.z);
      expect(Math.abs(d - 1.5)).toBeLessThan(1e-9);
      expect(nearest(p, stations as any)!.id).toBe(s.id);
      expect(Math.cos(p.heading)).toBeCloseTo((sx - p.x) / d, 9);
      expect(Math.sin(p.heading)).toBeCloseTo((sz - p.z) / d, 9);
    });
  }
});
