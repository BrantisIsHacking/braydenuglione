import { describe, it, expect } from 'vitest';
import { stations } from '../../src/content/stations';
import { PLAY_BOUNDS, MIN_STATION_GAP, REACH_M, SPAWN } from '../../src/arena/logic/court';

describe('station placement', () => {
  it('keeps every station inside play bounds with a 0.5 m margin', () => {
    for (const s of stations) {
      const [x, z] = s.pos;
      expect(x, s.id).toBeGreaterThanOrEqual(PLAY_BOUNDS.minX + 0.5);
      expect(x, s.id).toBeLessThanOrEqual(PLAY_BOUNDS.maxX - 0.5);
      expect(z, s.id).toBeGreaterThanOrEqual(PLAY_BOUNDS.minZ + 0.5);
      expect(z, s.id).toBeLessThanOrEqual(PLAY_BOUNDS.maxZ - 0.5);
    }
  });

  it('keeps stations at least MIN_STATION_GAP apart', () => {
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const a = stations[i], b = stations[j];
        const d = Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1]);
        expect(d, `${a.id} <-> ${b.id}`).toBeGreaterThanOrEqual(MIN_STATION_GAP);
      }
    }
  });

  it('keeps stations out of reach of spawn', () => {
    for (const s of stations) {
      const d = Math.hypot(s.pos[0] - SPAWN.x, s.pos[1] - SPAWN.z);
      expect(d, s.id).toBeGreaterThan(REACH_M + 0.5);
    }
  });

  it('places zones college-first', () => {
    const zone = (z: string) => stations.filter((s) => s.zone === z);
    for (const s of zone('projects')) expect(s.pos[0], s.id).toBeGreaterThan(5);
    for (const s of zone('now')) expect(s.pos[0], s.id).toBeGreaterThan(0);
    for (const s of zone('rutgers')) { expect(s.pos[0], s.id).toBeGreaterThan(0); expect(s.pos[0], s.id).toBeLessThan(5); }
    for (const s of zone('bridge')) { expect(s.pos[0], s.id).toBeGreaterThan(-5); expect(s.pos[0], s.id).toBeLessThan(0); }
    for (const s of zone('throwback')) expect(s.pos[0], s.id).toBeLessThan(-5);
    for (const s of zone('bench')) expect(s.pos[1], s.id).toBeGreaterThan(7.5);
  });
});
